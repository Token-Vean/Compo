# Privacidad de Compo

**Resumen en una línea**: Compo no envía nada a ningún servidor remoto. Punto.

## Qué datos toca Compo

- Lo que escribes en los formularios (campos del prompt, agente o skill).
- Tu preferencia de tema y de idioma.
- El modelo de Ollama que tengas marcado como activo.
- Si subes archivos para usarlos como contexto: el contenido se procesa en el navegador y, opcionalmente, se envía a tu Ollama local.

## A dónde van esos datos

Solo a estos sitios:

1. **Memoria del navegador** mientras tienes Compo abierto. Al cerrar la pestaña, se pierde, salvo lo que has marcado para conservar.
2. **localStorage del navegador**, únicamente para preferencias de configuración: `compo_theme`, `compo_lang`, `compo_model` y `compo_portable`. Nada de lo que escribes en formularios se persiste por defecto.
3. **Tu Ollama local** (`http://localhost:11434`) si pulsas botones que invocan asistencia IA. Ollama corre en tu máquina; tampoco envía nada fuera.
4. **El servidor local de Compo** (`http://127.0.0.1:8765`) si pulsas **Apagar**. Esa llamada solo solicita el cierre de la sesión local de Compo.

## A dónde **no** van

- A Anthropic.
- A los servidores de quien creó Compo.
- A cualquier endpoint de telemetría, analytics o crash reporting.
- A CDNs externos (todo está embebido o local).

## Cómo verificarlo tú mismo

1. Abre las herramientas de desarrollo del navegador (F12).
2. Ve a la pestaña "Red" o "Network".
3. Filtra por "Otros" o "All" y usa Compo.
4. Observa: solo verás peticiones a `127.0.0.1:8765` (los archivos estáticos de Compo y el endpoint local de apagado) y, si invocas asistencia IA, a `127.0.0.1:11434` (tu Ollama).

## Detector de PII al exportar

Antes de exportar un SKILL.md, Compo escanea el contenido buscando patrones que parezcan datos personales (DNI/NIE, IBAN español, correos electrónicos, teléfonos españoles, referencias de expedientes administrativos). Si detecta alguno, te avisa antes de generar el archivo. **Es un aviso heurístico**: no garantiza encontrar todo. Revisa siempre el archivo final si va a salir de tu equipo.

## Telemetría

Cero. Compo no incluye ningún script de Google Analytics, Plausible, Sentry, ni siquiera "anonymous usage stats". Nunca lo incluirá.

## Pertinencia LOPDGDD / RGPD

Si usas Compo en un ayuntamiento u otro contexto institucional, los responsables del tratamiento sois vosotros: Compo es una herramienta local que no comparte datos. No se requiere acuerdo de encargado del tratamiento con nadie por usar Compo, porque no hay ningún encargado externo. Si configuras Compo para apuntar a un Ollama remoto (no recomendado), entonces el responsable de ese Ollama sí entraría en juego.

## Exportación e importación de proyecto local

Desde la versión 0.1.3, Compo permite exportar un proyecto local en JSON. Esta acción es siempre manual e incluye la instrucción, resultado, revisión e historial breve de la sesión. El archivo queda en el equipo del usuario y no se envía a ningún servicio externo.

La importación de proyecto lee únicamente archivos `.json` seleccionados por el usuario. La aplicación no abre carpetas, no sincroniza documentos y no guarda automáticamente el contenido importado.

## Apagado desde la interfaz

Desde la versión 0.1.5, Compo incluye un botón **Apagar**. Este botón realiza una petición `POST /__compo_shutdown` al servidor local iniciado con `start.bat` o `start.sh`. Su única finalidad es detener el servidor local de Compo para que el usuario no tenga que cerrar la consola manualmente.

Este botón **no apaga Ollama**, no finaliza procesos del sistema, no cierra programas externos y no envía información fuera del equipo. Si Compo se abre directamente como `file://` o con un servidor genérico distinto de `server.py`, el botón mostrará un aviso y no podrá cerrar la sesión.


## Licencia y titularidad

Desde v0.1.13, Compo se distribuye bajo una licencia beta restrictiva de uso. Consulta `LICENSE` para el texto completo.
