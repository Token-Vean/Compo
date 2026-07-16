# Compo v0.1.14 · Changelog

Versión de consolidación técnica: corrige defectos de fiabilidad en la
generación con Ollama, elimina el post-procesado destructivo de skills,
endurece el servidor local y añade la primera suite de tests automatizados.

## Generación con Ollama

- **Contexto explícito (`num_ctx`)**: hasta ahora no se fijaba el tamaño de
  contexto y Ollama aplicaba su valor por defecto (habitualmente 4096
  tokens), insuficiente para los prompts internos de Compo. El resultado era
  un **truncamiento silencioso del principio de las instrucciones**, con
  degradación intermitente de la calidad. Ahora se envía `num_ctx: 16384`
  por defecto, ajustable por llamada.
- **Detección de salida truncada (`done_reason`)**: si el modelo agota el
  límite de generación (`done_reason: "length"`), la interfaz avisa de que
  el resultado puede estar incompleto y sugiere regenerar, en lugar de
  entregarlo como válido.
- **Generación en streaming**: la respuesta se muestra token a token en el
  área de resultado. Se ve el progreso real en lugar de una espera a ciegas
  de hasta varios minutos.
- **Botón «Cancelar generación»**: visible durante la generación, revisión y
  mejora de instrucción. Al cancelar una generación se conserva el texto
  parcial recibido, marcado como incompleto.
- **Endpoint dual**: se prueba primero `http://127.0.0.1:11434` y después
  `http://localhost:11434`. En algunos sistemas `localhost` resuelve a `::1`
  (IPv6) donde Ollama no escucha por defecto, lo que provocaba un falso
  «Ollama no detectado».
- **Migración a `/api/chat`** con mensajes system/user separados.
- Los mensajes de error del cliente Ollama pasan al sistema i18n (antes
  estaban fijos en español).

## Calidad de skills: de reescritura a lint

- **Eliminados los reemplazos léxicos globales** de `postProcessGenerated`
  que reescribían el cuerpo de la skill («base de datos» → «registro
  controlado», «Cumple» → «Adecuado», «hash aleatorio», etc.). Podían
  **corromper contenido legítimo** — por ejemplo, una skill sobre bases de
  datos documentales quedaba alterada en silencio.
- **Nuevo módulo `js/skill-lint.js`**: linter determinista y no destructivo
  de `SKILL.md`. Evalúa frontmatter (name, description, when_to_use,
  version, created, metadata sensible), secciones obligatorias del cuerpo y
  lenguaje de riesgo (certificación, estados cumple/no cumple, promesas
  criptográficas o técnicas no implementadas). Devuelve **puntuación 0-100 y
  hallazgos localizados** en ES/EN, que la interfaz muestra tras generar.
  El texto nunca se modifica: se informa y se deja decidir.
- Se mantiene la normalización estructural del frontmatter (determinista y
  acotada a la cabecera YAML).
- Este linter es la base para importar y auditar `SKILL.md` existentes,
  previsto en el roadmap.

## Seguridad y privacidad (revisión v0.1.14)

- **Servidor local (`server.py`)**:
  - Bloqueo de dotfiles: cualquier ruta con un componente que empiece por
    `.` devuelve 404. Evita servir `.git`, `.gitignore` o `.github` si
    estuvieran presentes en el directorio (en v0.1.13, `/​.git/config` era
    accesible desde el navegador local).
  - Listado de directorios desactivado (404 en lugar de enumerar contenido).
  - `Cache-Control: no-cache` en HTML para revalidar la app tras actualizar.
- **Distribución limpia**: nuevo script `tools/release.py` que genera el zip
  de distribución excluyendo `.git/`, artefactos de desarrollo y el PNG
  promocional de 5,3 MB (el paquete pasa de ~11,5 MB a <1 MB).
- **Detector de PII más preciso**:
  - DNI/NIE: se valida el **dígito de control (módulo 23)**; un patrón de
    8 dígitos + letra solo se marca si la letra es correcta. Elimina la
    mayoría de falsos positivos con signaturas y referencias numéricas.
  - Teléfono: guardas de límite para no casar subcadenas dentro de números
    más largos (expedientes, códigos).
  - El aviso previo a la descarga muestra ahora los **hallazgos enmascarados**
    (`12…8Z`) para decidir con criterio sin repetir el dato completo.
- **Guardado de sesión opt-in**: nueva casilla «Guardado de sesión» que
  conserva el trabajo en `sessionStorage` (memoria de la pestaña) para
  sobrevivir a recargas accidentales. Desactivado por defecto, se borra al
  cerrar la pestaña y nunca se escribe en disco, coherente con la política
  de persistencia mínima. Con el guardado desactivado, la pestaña avisa
  antes de cerrarse si hay trabajo sin exportar.

## Interfaz y accesibilidad

- El panel de estado del builder es ahora una región `aria-live="polite"`:
  los lectores de pantalla anuncian generación, errores y avisos.
- Al terminar una generación de skill se muestra la puntuación de calidad.

## Windows

- `start.bat` detecta Python de forma robusta: prueba primero el launcher
  oficial `py -3` y verifica que el intérprete responde, evitando el alias
  de la Microsoft Store que abre la tienda en lugar de ejecutar Python.

## Tests

- Nueva carpeta `tests/` con suite para `node --test` (sin dependencias):
  24 tests que cubren el detector de PII con checksum, sanitizadores,
  validadores y el linter de skills, incluida una prueba de regresión del
  defecto de reescritura de v0.1.13.
  Ejecución: `node --test tests/*.js`

## Mantenimiento

- Versión unificada en una constante por componente (`APP_VERSION` en
  `compo.js`, `__version__` en `server.py`); `exportProject` ya no lleva la
  versión escrita a mano.
