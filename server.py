#!/usr/bin/env python3
"""
Compo · servidor local

Servidor HTTP estático limitado a localhost con un endpoint interno de apagado.
No expone Compo en la red y no requiere dependencias externas.

Mejoras de seguridad respecto a v0.1.13:
- Bloqueo de archivos y directorios ocultos (dotfiles): rutas que contengan
  un componente que empiece por "." devuelven 404. Evita servir .git,
  .gitignore, .github y similares si están presentes en el directorio.
- Listado de directorios desactivado: solicitar un directorio sin índice
  devuelve 404 en lugar de enumerar su contenido.
- Cache-Control: no-cache en HTML para que el navegador revalide la app
  tras una actualización; el resto de estáticos se sirven sin directivas
  de caché agresivas.

Se mantienen de v0.1.13:
- Comprobación de Origin / Sec-Fetch-Site en endpoints internos (mitigación
  CSRF: una página externa con `mode: no-cors` no puede apagar el servidor).
- Cabeceras de seguridad endurecidas (CSP, Permissions-Policy, COOP, CORP).
- Header `Server:` sin versión específica para reducir fingerprinting.
- Mensaje claro si el puerto está ocupado y comprobación de versión de Python.
"""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

__version__ = "0.1.14"

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

PERMISSIONS_POLICY = (
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
    "magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()"
)


def _is_allowed_origin(value, allowed):
    """Comparación estricta contra los orígenes permitidos, sin tolerancia a
    subdominios ni wildcards."""
    if not value:
        return False
    return value in allowed


def _path_has_hidden_component(url_path):
    """True si algún componente de la ruta empieza por punto.

    Se evalúa sobre la ruta URL ya sin query/fragment. Bloquea el acceso a
    .git, .gitignore, .github, archivos de configuración ocultos, etc.,
    incluso si por error terminan dentro de la distribución.
    """
    clean = posixpath.normpath(url_path.split("?", 1)[0].split("#", 1)[0])
    return any(part.startswith(".") for part in clean.split("/") if part)


class CompoServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True
    allowed_origins = ()


class CompoHandler(SimpleHTTPRequestHandler):
    # Server identifier sin versión específica: reduce fingerprinting.
    server_version = "CompoLocalHTTP"
    sys_version = ""  # oculta también la versión de Python.

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", PERMISSIONS_POLICY)
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Content-Security-Policy", CSP)
        super().end_headers()

    # ------------------------------------------------------------------ #
    # Endurecimiento del servidor de estáticos
    # ------------------------------------------------------------------ #
    def send_head(self):
        # 1) Nunca servir rutas con componentes ocultos (dotfiles).
        if _path_has_hidden_component(self.path):
            self.send_error(404, "Not found")
            return None
        # 2) Nunca listar directorios: si la ruta resuelve a un directorio,
        #    solo se sirve si existe un index; en caso contrario, 404.
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            for index in ("index.html", "index.htm"):
                if os.path.exists(os.path.join(path, index)):
                    break
            else:
                self.send_error(404, "Not found")
                return None
        return super().send_head()

    def list_directory(self, path):
        # Defensa en profundidad: aunque send_head ya bloquea directorios,
        # cualquier ruta que llegue aquí recibe 404 en lugar de un listado.
        self.send_error(404, "Not found")
        return None

    def guess_type(self, path):
        ctype = super().guess_type(path)
        # Revalidación del HTML tras actualizaciones de la app.
        if str(path).endswith((".html", ".htm")):
            self._compo_no_cache = True
        return ctype

    def send_response(self, code, message=None):
        super().send_response(code, message)
        if getattr(self, "_compo_no_cache", False):
            self.send_header("Cache-Control", "no-cache")
            self._compo_no_cache = False

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
            self._send_json({
                "ok": False,
                "error": "forbidden_origin",
            }, status=403)
            return

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
        try:
            line = fmt % args
        except Exception:
            line = fmt
        print("  [Compo] " + line, flush=True)


def _bind_server(host, port, handler):
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
