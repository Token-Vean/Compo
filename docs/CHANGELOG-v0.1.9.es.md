# Changelog · Compo v0.1.9

## Resumen

La versión 0.1.9 endurece la seguridad del servidor local y limpia inconsistencias detectadas en una auditoría previa al cierre de la beta. Sin cambios funcionales en el builder ni en la asistencia IA: el flujo de v0.1.8 se mantiene tal cual.

## Mejoras de seguridad en `server.py`

- **Mitigación de CSRF en endpoints internos** (`/__compo_shutdown` y `/__compo_health`). Las peticiones se rechazan con HTTP 403 si su `Origin` no coincide exactamente con `http://localhost:<puerto>` o `http://127.0.0.1:<puerto>`. Si el header `Origin` no llega, se acepta solo cuando el navegador marca `Sec-Fetch-Site: same-origin`. Antes, una página externa podía apagar el servidor de un usuario simplemente con `fetch('http://localhost:8765/__compo_shutdown', { method: 'POST', mode: 'no-cors' })`.
- **Cabeceras de seguridad en HTTP** además del `<meta>` del HTML:
  - `Content-Security-Policy` (mismas directivas que el meta).
  - `Permissions-Policy` deshabilitando explícitamente cámara, micrófono, geolocalización, USB, pago, sensores y `interest-cohort`.
  - `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-origin` para reforzar el aislamiento.
- **Reducción de fingerprinting**: el header `Server` ya no expone la versión específica ni la versión de Python (`CompoLocalHTTP` en lugar de `CompoLocalHTTP/0.1.6 Python/3.12.3`).
- **Versión consolidada**: el número de versión está ahora en una única constante `__version__` en `server.py` y se sincroniza con el resto del paquete.

## Robustez del arranque

- Comprobación previa de **Python 3.8 o superior** con mensaje legible si el intérprete es demasiado antiguo.
- Mensaje claro cuando el puerto **8765 está ocupado** en lugar de stack trace, sugiriendo arranque con `--port 8766`.
- Aviso explícito si el usuario fuerza `--host 0.0.0.0` u otra interfaz no local, recordando que rompe el modelo de seguridad.
- Cierre limpio del socket si la fase final falla.

## Limpieza

- Eliminado `__pycache__/` del paquete distribuido. Se añade `.gitignore` para evitar que vuelva en futuros ZIPs.
- Corregida versión `0.1.6` hardcodeada en la exportación de proyecto (`compo.js: exportProject`) → `0.1.9`.
- Sustituido el SVG placeholder genérico de `assets/logo-compo.svg` por el logo oficial: tres piezas blancas unidas formando una L con una cuarta pieza despegada y rotada.

## Verificación reproducible

Las protecciones CSRF se pueden probar con:

```bash
# Esto debe devolver 403 forbidden_origin
curl -X POST -H "Origin: https://evil.example.com" -H "Content-Type: text/plain" \
  --data 'test' http://127.0.0.1:8765/__compo_shutdown

# Esto debe devolver 200 y apagar el servidor
curl -X POST -H "Origin: http://127.0.0.1:8765" -H "Content-Type: application/json" \
  --data '{}' http://127.0.0.1:8765/__compo_shutdown
```

Las cabeceras de seguridad se pueden inspeccionar con:

```bash
curl -I -H "Origin: http://127.0.0.1:8765" http://127.0.0.1:8765/compo.html
```

## Sin cambios

- No se han tocado los prompts de generación.
- No se ha tocado el cliente Ollama.
- No se han cambiado los i18n.
- No se ha tocado el flujo del builder unificado.

Las funciones que estaban operativas en v0.1.8 siguen operando idénticamente: detección de Ollama, descarga de modelos, generación, regeneración, mejora de instrucción, revisión crítica, exportación con detección PII, y apagado desde la interfaz.
