#!/usr/bin/env python3
"""
Compo · servidor local

Servidor HTTP estático limitado a localhost con un endpoint interno de apagado.
No expone Compo en la red y no requiere dependencias externas.

Mejoras de seguridad respecto a v0.1.5:
- Comprobación de Origin / Sec-Fetch-Site en endpoints internos para mitigar
  CSRF desde páginas externas (un atacante con `mode: no-cors` ya no puede
  apagar el servidor de la víctima).
- Cabeceras de seguridad endurecidas: Content-Security-Policy y Permissions-Policy
  enviadas también por HTTP, además del meta del HTML; aislamiento por origen
  con Cross-Origin-Opener-Policy y Cross-Origin-Resource-Policy.
- Versión consolidada en una constante única.
- El header `Server:` no revela versión específica para reducir fingerprinting.
- Mensaje claro si el puerto está ocupado, en lugar de stack trace.
- Comprobación de versión mínima de Python.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

__version__ = "0.1.13"

# Comprobar versión mínima de Python antes de usar tipos modernos.
if sys.version_info < (3, 8):
    sys.stderr.write(
        "Compo requires Python 3.8 or later. "
        f"Detected: {sys.version.split()[0]}\n"
    )
    sys.exit(1)

# Orígenes considerados propios de Compo. Cualquier petición a endpoints
# internos (/__compo_*) que venga de otro Origin será rechazada.
ALLOWED_ORIGINS_TEMPLATE = (
    "http://localhost:{port}",
    "http://127.0.0.1:{port}",
)

# Política de seguridad de contenido enviada por HTTP.
# Replica la CSP del meta del HTML, con la mejora de cubrir también todos los
# recursos estáticos (los meta solo afectan al documento que los contiene).
CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "img-src 'self' data:; "
    "connect-src 'self' http://localhost:11434 http://127.0.0.1:11434; "
    "font-src 'self'; "
    "form-action 'none'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "object-src 'none'"
)

# Permissions-Policy: una app local no necesita ninguna API sensible del navegador.
PERMISSIONS_POLICY = (
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
    "magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()"
)


def _is_allowed_origin(value, allowed):
    """Devuelve True si el valor coincide exactamente con alguno de los
    orígenes permitidos. La comparación es estricta: sin tolerancia a
    subdominios ni a wildcards."""
    if not value:
        return False
    return value in allowed


class CompoServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True
    allowed_origins = ()


class CompoHandler(SimpleHTTPRequestHandler):
    # Server identifier sin versión específica: reduce fingerprinting.
    server_version = "CompoLocalHTTP"
    sys_version = ""  # oculta también la versión de Python.

    def end_headers(self):
        # Cabeceras estáticas para todos los recursos.
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", PERMISSIONS_POLICY)
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        # CSP es relevante sobre todo en el HTML; en otros recursos no daña.
        self.send_header("Content-Security-Policy", CSP)
        super().end_headers()

    # ------------------------------------------------------------------ #
    # Helpers internos
    # ------------------------------------------------------------------ #
    def _origin_ok(self):
        """Comprobación de origen para endpoints internos. Acepta Origin o,
        si no llega (algunos navegadores antiguos), Sec-Fetch-Site=same-origin
        como confirmación equivalente."""
        allowed = self.server.allowed_origins
        origin = self.headers.get("Origin")
        sfs = self.headers.get("Sec-Fetch-Site")

        if origin is not None:
            return _is_allowed_origin(origin, allowed)
        # Sin Origin: aceptamos solo si el navegador marca explícitamente
        # same-origin. Esto bloquea peticiones cross-origin (que llevarían
        # cross-site) y peticiones de páginas no-https sin origin enviado.
        if sfs == "same-origin":
            return True
        # Las herramientas locales (curl, wget) no envían Origin ni
        # Sec-Fetch-Site; rechazamos por defecto. El usuario puede usar
        # Ctrl+C en la terminal si quiere apagar sin la UI.
        return False

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ------------------------------------------------------------------ #
    # Métodos HTTP
    # ------------------------------------------------------------------ #
    def do_GET(self):  # noqa: N802 - nombre impuesto por http.server
        path = self.path.split("?", 1)[0]
        if path == "/__compo_health":
            if not self._origin_ok():
                self.send_error(403, "Forbidden")
                return
            self._send_json({
                "ok": True,
                "app": "Compo",
                "version": __version__,
            })
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802 - nombre impuesto por http.server
        path = self.path.split("?", 1)[0]
        if path != "/__compo_shutdown":
            self.send_error(404, "Not found")
            return

        if not self._origin_ok():
            # No revelamos detalles del origen; respuesta genérica.
            self._send_json({
                "ok": False,
                "error": "forbidden_origin",
            }, status=403)
            return

        # Consumir un posible body pequeño para evitar dejar datos pendientes.
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            self.rfile.read(min(length, 4096))

        self._send_json({
            "ok": True,
            "message": "Compo local server is shutting down. You can close this browser tab."
        })

        def stop():
            print(
                "\n  Compo: apagado solicitado desde la interfaz. Cerrando servidor local...\n",
                flush=True,
            )
            self.server.shutdown()

        threading.Timer(0.35, stop).start()

    def log_message(self, fmt, *args):
        # Log mínimo: suficiente para diagnóstico local, sin registrar cuerpos
        # ni datos del usuario.
        try:
            line = fmt % args
        except Exception:
            line = fmt
        print("  [Compo] " + line, flush=True)


def _bind_server(host, port, handler):
    """Intenta crear el servidor y muestra un mensaje legible si el puerto
    está ocupado."""
    try:
        return CompoServer((host, port), handler)
    except OSError as exc:
        if exc.errno in (98, 48, 10048):  # EADDRINUSE Linux / macOS / Windows
            sys.stderr.write(
                f"\n  X El puerto {port} ya esta en uso.\n"
                f"    Otra instancia de Compo (o de algun otro programa) esta\n"
                f"    escuchando en ese puerto. Cierra esa instancia o arranca\n"
                f"    Compo en otro puerto:\n\n"
                f"      python3 server.py --port 8766\n\n"
            )
            sys.exit(2)
        raise


def main():
    parser = argparse.ArgumentParser(description="Servidor local de Compo")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    if args.host not in ("127.0.0.1", "localhost"):
        sys.stderr.write(
            f"\n  !  Atencion: vinculando a {args.host} en lugar de 127.0.0.1.\n"
            f"     Compo esta pensada para uso local. Vincular a otra interfaz\n"
            f"     expone la aplicacion a tu red local; no se recomienda.\n\n"
        )

    root = Path(__file__).resolve().parent
    os.chdir(root)

    server = _bind_server(args.host, args.port, CompoHandler)
    server.allowed_origins = tuple(
        tpl.format(port=args.port) for tpl in ALLOWED_ORIGINS_TEMPLATE
    )

    url = f"http://{args.host}:{args.port}/compo.html"
    print("", flush=True)
    print("  Compo - servidor local", flush=True)
    print("  ----------------------", flush=True)
    print(f"  URL:     {url}", flush=True)
    print(f"  Puerto:  {args.port}", flush=True)
    print(f"  Version: {__version__}", flush=True)
    print("", flush=True)
    print("  Puedes apagar Compo desde la interfaz o con Ctrl+C.", flush=True)
    print("", flush=True)

    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        print("\n  Compo: apagado manual con Ctrl+C.\n", flush=True)
    finally:
        try:
            server.server_close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
