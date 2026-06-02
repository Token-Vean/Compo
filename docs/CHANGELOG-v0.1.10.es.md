# Changelog · Compo v0.1.10

Versión beta lista para distribución. Cierra los huecos que la auditoría de generadores de Prompt, Agent y Skill identificó tras las pruebas de validación, integra el logo oficial en la cabecera y añade los elementos formales mínimos para distribuir el paquete.

## Mejoras en `prompts/build-agent.md`

Reescrito completamente. La versión anterior pedía al modelo "construir una **especificación profesional de agente**", lo que producía una tabla descriptiva (ficha técnica del agente) en lugar de un prompt operativo pegable. La nueva versión exige explícitamente un **prompt en segunda persona** ("Eres X, recibes Y, produces Z"), con plantillas específicas por caso si la instrucción del usuario menciona varios escenarios distintos.

Reglas estrictas que ahora aplica:

- Prompt en segunda persona, no especificación en tercera persona.
- No inventar capacidades de "memoria persistente" que un prompt no tiene.
- No inventar el formato de salida: si la instrucción habla de borrador para una persona, no se devuelve JSON.
- No introducir jerga NLP innecesaria ("tokenización", "preprocesado").
- No prometer conformidad legal con verbos como "garantiza", "certifica", "valida cumplimiento".
- No introducir verbos coercitivos que el agente no puede ejecutar ("bloquear", "denegar automáticamente").
- Si la instrucción menciona registros oficiales o sistemas externos, no inventar denominaciones; redirigir al usuario.

## Mejoras en `prompts/build-prompt.md`

Reglas reforzadas tras detectar tres fallos en outputs reales:

- Si la instrucción describe una **estructura jerárquica** (función / subfunción / serie, categoría / subcategoría, dimensión / subdimensión), el prompt resultante debe incluir un mecanismo en la salida para distinguir esos niveles. Antes, el modelo a veces reducía la salida al nivel más profundo y perdía la jerarquía.
- Prohibición explícita de anglicismos profesionales innecesarios ("no hallucination", "ground truth"). Se sustituyen por la denominación española habitual.
- El formato Markdown del prompt resultante debe ser sintácticamente correcto: bloques de código bien cerrados, sin anidamientos rotos.
- Si el prompt resultante necesita pedir aclaración al usuario, debe indicarlo explícitamente.

## Mejoras en `prompts/build-skill.md`

Cierra los tres puntos pendientes identificados en las pruebas adversariales:

1. **Lista absoluta de capacidades técnicas prohibidas**: hashes, firmas digitales, sellos criptográficos, sellos de tiempo, identificadores criptográficos, registros de auditoría con integridad criptográfica, consultas a registros oficiales (BOE, AEPD, Consejo de Transparencia, etc.). La regla anterior tenía una excepción "salvo que el usuario lo pida"; esa excepción se elimina. Si el usuario las pide, la skill debe **declinarlas explícitamente** en una sección "Lo que la skill NO hace", no transferirlas como inputs que el usuario debe aportar por su cuenta.
2. **Lista de verbos del usuario que la skill debe rechazar y reformular**: "garantiza", "certifica", "valida cumplimiento", "emite sello", "firma digital", "bloquea automáticamente", "reemplaza al DPO/archivero/jurídico". Cada uno con su reformulación prudente.
3. **Verificación de denominaciones de sistemas externos**: si el usuario menciona un registro oficial, la skill no inventa denominaciones técnicas. Si hay duda, redirige al usuario para que aporte la referencia.

## Modo portable para skills

Nuevo toggle en la UI del builder de skills: **Modo portable**. Cuando está activado, el prompt interno instruye al modelo a generar la skill **sin referencias a Claude**, hablando del ejecutor como "el asistente" o "el modelo". Pensado para que la skill sea reutilizable en otras plataformas (ChatGPT, asistentes locales con Ollama, Manus, etc.).

El estado del toggle se persiste en `localStorage` con la clave `compo_portable`. Solo aparece cuando el tipo activo es Skill (no en Prompt ni en Agent, donde no aplica).

El campo `portable: true|false` se incorpora al payload que recibe el modelo, y `prompts/build-skill.md` tiene una sección específica que reacciona a ese campo.

## Logo oficial integrado en la cabecera

La cabecera mostraba un SVG inline genérico (un icono de puzzle simplificado). Ahora referencia `assets/logo-compo.svg` —el logo oficial con las cuatro piezas blancas sobre fondo verde y la pieza despegada— mediante una etiqueta `<img>` con tamaño constreñido. Los estilos de `.compo-brand-mark` se han limpiado en consecuencia: ya no necesita fondo propio, porque el SVG lo trae.

## Distribución

- Añadido archivo `LICENSE` (MIT) en la raíz del paquete.
- README actualizado a v0.1.10 con menciones explícitas de las mejoras.
- `SHA256SUMS.txt` regenerado.
- Versión consolidada a 0.1.10 en los tres puntos donde aparecía: `server.py:__version__`, `compo.js:exportProject`, `README.md`.

## Sin cambios

- No se han tocado los demás prompts (`critique.md`, `regenerate.md`, `improve-instruction.md`, `system.md`).
- No se ha tocado el cliente Ollama ni la lógica de descarga de modelos.
- No se han tocado las protecciones CSRF ni los headers de seguridad de v0.1.9.
- No se han tocado las plantillas en `plantillas/`.
- El detector PII, el postprocesado local y la lógica del builder permanecen estables.
