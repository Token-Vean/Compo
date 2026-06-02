# Changelog · Compo v0.1.4

## Objetivo

La versión 0.1.4 corrige el principal problema detectado en la generación de skills: la salida podía ser formalmente válida, pero poco operativa para activación automática en entornos compatibles con Agent Skills.

## Cambios principales

- Se ha reforzado `prompts/build-skill.md` para que Ollama genere skills con `name` breve, semántico y estable.
- Se exige que `description` sea una metadata de activación real: debe incluir el caso de uso principal y disparadores naturales que el usuario podría escribir.
- Se prohíben descripciones genéricas como “Skill generada con Compo”.
- Se evita incluir la instrucción base del usuario como sección del `SKILL.md` final salvo que sea necesario.
- Se obliga a diferenciar capacidades instructivas de capacidades técnicas implementadas.
- Se prohíbe prometer conteo exacto de tokens, llamadas API, OCR, validaciones automáticas, scripts o integraciones si la skill no incorpora esos recursos.
- Se prohíbe pedir API keys, credenciales o secretos dentro de una skill instructiva.
- Se ha actualizado el fallback local de skills para que tampoco genere metadata genérica.
- Se ha reforzado el prompt de regeneración para mejorar especialmente la activabilidad de skills.
- Se ha reforzado el prompt de revisión crítica para auditar `name`, `description`, activación, no activación, límites técnicos y guardrails.
- Se han actualizado las ayudas de los campos avanzados de skills para explicar que `description` no es una descripción decorativa, sino una ayuda de activación.
- Se añade una plantilla externa de skill para optimización de prompts de Claude.

## Resultado esperado

Las skills generadas deberían tener más posibilidades de ser seleccionadas por un agente compatible con carga progresiva, porque la metadata inicial ya no describe la procedencia del archivo, sino el uso real de la capacidad.

## Limitación

Compo no puede garantizar por sí solo que un runtime externo active siempre una skill. La activación depende del sistema que cargue las skills, del modelo usado, de la similitud entre la petición del usuario y la description, y de la calidad del propio `SKILL.md`.
