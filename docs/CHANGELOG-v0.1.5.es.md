# Changelog · Compo v0.1.5

## Resumen

La versión 0.1.5 añade apagado controlado desde la interfaz. El objetivo es que el usuario pueda cerrar la sesión local de Compo sin tener que volver a la consola y pulsar Ctrl+C manualmente.

## Cambios principales

- Añadido botón **Apagar** en la cabecera de la aplicación.
- Añadido `server.py`, servidor local propio basado en la biblioteca estándar de Python.
- Sustituidos los arranques `python -m http.server` por `python server.py` en `start.sh` y `start.bat`.
- Añadido endpoint local `POST /__compo_shutdown` para cerrar el servidor de Compo.
- Añadida pantalla final de apagado con aviso de que puede cerrarse la pestaña del navegador.
- Añadidas cadenas ES/EN para la nueva función.
- Actualizada la documentación de privacidad y seguridad.

## Alcance del apagado

El botón **Apagar** detiene únicamente el servidor local de Compo iniciado con `start.bat` o `start.sh`.

No apaga Ollama, no mata procesos externos, no ejecuta comandos del sistema y no cierra aplicaciones de terceros. Esta decisión evita efectos laterales peligrosos y mantiene el alcance de Compo limitado a su propia sesión local.

## Comportamiento esperado

- Si Compo se abrió con `start.bat` en Windows, el servidor se detiene y la consola debería cerrarse o quedar finalizada según el modo de ejecución.
- Si Compo se abrió con `start.sh` en Linux/macOS, el proceso del servidor se detiene y la terminal vuelve al prompt.
- Si Compo se abrió directamente como `file://` o con otro servidor genérico, el botón muestra un aviso y no puede cerrar la sesión.
