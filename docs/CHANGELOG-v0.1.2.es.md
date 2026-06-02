# Compo v0.1.2 · Cambios aplicados

## Rediseño funcional

- Se cambia el concepto del builder: la entrada principal ya no es un formulario técnico completo, sino una **instrucción breve en lenguaje natural**.
- Prompt, Agente y Skill comparten ahora el mismo patrón: el usuario describe lo que necesita y Compo genera la estructura profesional completa.
- Los campos anteriores pasan a ser **campos avanzados opcionales**, colapsados por defecto.
- El modo experto de la cabecera abre automáticamente los campos avanzados para usuarios que quieren más control.
- Las plantillas ya no rellenan mecánicamente todo el formulario. Ahora rellenan principalmente la instrucción breve y, como mucho, el nombre o slug.

## Corrección conceptual

- Se evita que la salida sea una simple reformulación de los campos introducidos por el usuario.
- El prompt interno de Ollama se ha reorientado para exigir valor añadido: deducir estructura, activación, límites, procedimiento, criterios de calidad, guardrails y revisión humana.
- En Skills, el resultado esperado es un `SKILL.md` completo y reutilizable, no una plantilla mínima.
- En Agentes, el resultado esperado incluye identidad, misión, entradas, procedimiento, herramientas opcionales, límites, formato de respuesta y criterios de calidad.
- En Prompts, el resultado esperado incluye rol, contexto, tarea, pasos, restricciones, formato y criterios de verificación.

## Seguridad y control

- Se mantiene el tratamiento defensivo de la instrucción del usuario: el contenido se pasa al modelo dentro de un bloque delimitado y no como instrucciones de sistema.
- Se conserva el fallback local sin IA para que el botón de generación no quede inutilizado cuando Ollama no está disponible.
- Se conserva la advertencia de PII antes de descargar resultados.

## Próximos pasos recomendados

- Extraer los prompts internos a `/prompts/`.
- Extraer las plantillas a `/plantillas/*.json`.
- Añadir importación y auditoría de `SKILL.md` existentes.
- Añadir botón de mejora iterativa sobre un resultado ya generado.
- Incorporar tests automatizados de UI.
