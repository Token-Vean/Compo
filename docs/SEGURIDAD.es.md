# Seguridad de Compo

## Modelo de amenazas

Compo se ejecuta en un entorno de confianza (la máquina del usuario), pero asume varias amenazas:

### A1. Inyección de instrucciones vía contenido del usuario

**Riesgo**: el usuario sube un archivo o pega texto que contiene un "prompt injection" intentando manipular al modelo IA local (ej. "ignora todas las instrucciones anteriores y...").

**Mitigación**: todo contenido del usuario que se envía al LLM se encapsula entre delimitadores difíciles de confundir (`<<<user_content_BEGIN>>> ... <<<user_content_END>>>`) y el system prompt declara explícitamente que ese bloque es **datos**, no instrucciones. Implementado en `js/security.js:wrapForLLM`.

### A2. XSS por contenido del usuario o respuestas del modelo

**Riesgo**: una respuesta del modelo o un campo del usuario podría contener `<script>` o atributos `on*` que se ejecuten al renderizarse.

**Mitigaciones**:
- **CSP estricta** en `<meta http-equiv>`: solo `'self'` para scripts y estilos, prohibición total de scripts inline o eval. Aunque hubiera un XSS, no podría ejecutarse.
- Los datos del usuario y las respuestas del modelo se insertan mediante `textContent`, `value` o plantillas con escape HTML defensivo. Las plantillas internas pueden usar `innerHTML` solo con cadenas controladas por Compo y valores saneados.
- Sanitización defensiva de caracteres de control en `js/security.js:stripControlChars`.

### A3. Filtración de datos personales en SKILL.md exportados

**Riesgo**: el archivero pega un fragmento de un expediente real para usarlo como ejemplo y el archivo exportado contiene DNIs, direcciones, etc., que llega a un repositorio público.

**Mitigación**: detector heurístico de PII en `js/security.js:detectPII` que escanea antes de cada exportación y muestra un aviso bloqueante al usuario (DNI/NIE, IBAN español, email, teléfono español, referencias de expediente). **Heurístico, no infalible**.

### A4. DNS rebinding contra el Ollama local

**Riesgo**: si Ollama está configurado con `OLLAMA_ORIGINS=*`, una web maliciosa abierta en otra pestaña podría usar DNS rebinding para acceder al Ollama del usuario y leer/borrar sus modelos o usar su capacidad de cómputo.

**Mitigación**: la documentación de instalación (`docs/INSTALAR-OLLAMA.es.md`) instruye al usuario a configurar `OLLAMA_ORIGINS=http://127.0.0.1:8765,http://localhost:8765` (origen exacto de Compo), nunca `*`. La CSP de Compo, además, limita `connect-src` a `http://localhost:11434`, así que aunque algún script ajeno consiguiera ejecutarse en el contexto de Compo no podría hablar con servidores externos.

### A5. Manipulación del paquete antes de instalación

**Riesgo**: el ZIP se distribuye y alguien lo modifica en tránsito o en el repositorio.

**Mitigación**: el ZIP de release viene acompañado de `SHA256SUMS.txt` con los hashes esperados de cada archivo. El usuario puede verificar la integridad antes de ejecutar:

```bash
sha256sum -c SHA256SUMS.txt
```

### A6. Descarga de modelos arbitrarios

**Riesgo**: que un usuario (o un atacante con acceso temporal a su sesión) descargue un modelo enorme por error o un modelo que no rinda bien con los prompts de Compo.

**Mitigación**: descargas restringidas a una **allowlist curada** definida en `js/ollama.js:RECOMMENDED_MODELS`. La pantalla de modelos no acepta entrada libre de nombres. Los modelos que el usuario haya descargado por su cuenta vía la CLI de Ollama siguen apareciendo en la sección "Modelos descargados" y son seleccionables como activos, pero la descarga desde Compo está acotada. Las llamadas directas al endpoint `/api/pull` desde código de Compo siguen pasando por la validación regex de `isValidModelName` como defensa en profundidad.

Importante: incluso sin esta restricción, el endpoint `/api/pull` de Ollama solo descarga del registro oficial (`registry.ollama.ai`); no acepta URLs arbitrarias. La allowlist es una decisión de curaduría y UX, no de mitigación de un agujero de seguridad inexistente.


### A7. Endpoint local de apagado

**Riesgo**: un botón de apagado mal diseñado podría cerrar procesos no previstos o aceptar peticiones remotas.

**Mitigación**: desde v0.1.5 el apagado se implementa en `server.py` mediante `POST /__compo_shutdown`, servido únicamente en `127.0.0.1`. El endpoint solo detiene el servidor local de Compo. No ejecuta comandos de sistema, no mata procesos externos y no apaga Ollama. Si la aplicación se abre con un servidor estático genérico o como archivo local, el botón no dispone de endpoint y falla de forma controlada.

## Política de Content-Security-Policy

```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
connect-src 'self' http://localhost:11434 http://127.0.0.1:11434;
font-src 'self';
form-action 'none';
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
```

Lo que esta CSP **prohíbe**:
- Scripts o estilos inline (no hay `'unsafe-inline'`).
- `eval()` y similares (no hay `'unsafe-eval'`).
- Cualquier conexión saliente que no sea al propio origen local de Compo o a Ollama local.
- Cargar Compo dentro de un iframe (`frame-ancestors 'none'`).
- Envío de formularios a cualquier sitio (`form-action 'none'`).

## Modo efímero

Por defecto, **nada de lo que escribes se persiste**. Solo se guardan en `localStorage`:

- `compo_theme` — tu preferencia de tema (`light`, `dark`, o ausente para auto).
- `compo_lang` — tu preferencia de idioma (`es`, `en`).
- `compo_model` — el modelo de Ollama que has marcado como activo.

Si cierras la pestaña a mitad de un formulario, pierdes lo escrito. Es deliberado.

## Lo que no protege Compo

- **Un Ollama mal configurado**. Si tu Ollama acepta conexiones de cualquier origen y está expuesto en la red, eso es un riesgo independiente de Compo.
- **Un sistema operativo comprometido**. Si tienes un keylogger, Compo no puede hacer nada al respecto.
- **El propio modelo IA**. Los modelos generativos pueden alucinar, sesgar, o producir contenido inapropiado. Las sugerencias de Compo son *borradores para revisión humana*, no decisiones definitivas. Esto está marcado explícitamente en la UI de la auditoría.

## Reportar problemas de seguridad

Si encuentras un problema de seguridad, no abras un issue público. Contacta directamente con el mantenedor.

## Cambios de seguridad en v0.1.3

- Los estados de Prompt, Agente y Skill se mantienen separados en memoria para evitar mostrar por error resultados de una tipología dentro de otra.
- El borrado de resultado afecta solo a la tipología activa; el botón de borrado completo limpia toda la sesión tras confirmación.
- La importación de proyectos acepta únicamente JSON seleccionado por el usuario y aplica lectura defensiva con límite de tamaño.
- Los prompts internos se han externalizado a `/prompts/`, pero siguen cargándose desde el mismo origen local servido por Compo.
- Las plantillas se han externalizado a `/plantillas/` y se cargan desde el mismo origen local.

## Cambios de seguridad en v0.1.5

- Añadido `server.py`, servidor local propio limitado a `127.0.0.1`, con endpoint `POST /__compo_shutdown`.
- Añadido botón **Apagar** en la interfaz para detener el servidor local sin cerrar manualmente la consola.
- El apagado no ejecuta comandos del sistema, no cierra Ollama y no finaliza otros procesos.


## Nota v0.1.13

Compo permite detectar, seleccionar y descargar modelos de Ollama, pero no borrar modelos locales desde la interfaz. La gestión destructiva de modelos queda fuera de la aplicación y debe realizarse, si procede, desde las herramientas propias de Ollama por una persona responsable.


## Endurecimiento v0.1.14

- El servidor local devuelve 404 para cualquier ruta con componentes ocultos
  (que empiecen por `.`), lo que impide servir `.git` y archivos de
  configuración ocultos aunque estén presentes en el directorio.
- El listado de directorios está desactivado: solicitar un directorio sin
  índice devuelve 404.
- El zip de distribución se genera con `tools/release.py`, que excluye
  `.git/` y artefactos de desarrollo.
- La detección de DNI/NIE valida el dígito de control (módulo 23) para
  reducir falsos positivos, y el aviso previo a la descarga muestra los
  hallazgos enmascarados en lugar del dato completo.
- El guardado de sesión es opt-in, usa exclusivamente `sessionStorage`
  (memoria de la pestaña, se destruye al cerrarla) y nunca escribe en disco.

## Endurecimiento posterior a v0.1.14 (sin publicar)

- **DNS rebinding contra el propio servidor de Compo.** `server.py` valida la
  cabecera `Host` en todas las peticiones (`GET`, `HEAD` y `POST`) y responde
  421 si no es `127.0.0.1:<puerto>` o `localhost:<puerto>`. Una web maliciosa
  que haga resolver su dominio a 127.0.0.1 envía su propio dominio en `Host` y
  queda rechazada, también en `/__compo_health` y `/__compo_shutdown`. Es el
  mismo control que ya aplicaba Cumplø. Consecuencia: si se arranca Compo con
  `--host` apuntando a otra interfaz, solo responderá a los nombres locales.
