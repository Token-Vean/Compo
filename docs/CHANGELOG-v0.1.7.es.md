# Changelog · Compo v0.1.7

## Objetivo

Mejorar la generación de skills para que no solo sean activables por `name` y `description`, sino también operativas, prudentes y profesionalmente utilizables.

## Cambios principales

- Refuerzo completo de `prompts/build-skill.md`.
- Refuerzo de `prompts/system.md` para evitar promesas absolutas y lenguaje de certificación.
- Se añade uso opcional de `when_to_use` para reforzar la activación cuando sea útil.
- Se penalizan expresamente descripciones con “garantiza”, “certifica”, “valida cumplimiento” o equivalentes.
- Se evita el uso de estados “cumple / no cumple” en revisiones preliminares si no existe marco formal aportado.
- Se favorecen estados prudentes: “Adecuado”, “Parcial”, “Insuficiente”, “Ausente” y “No evaluable”.
- Se exige evidencia textual en tablas de revisión o auditoría.
- Se prohíben límites arbitrarios no indicados por el usuario, como máximos de caracteres, idioma obligatorio o formatos exclusivos.
- Se añade una plantilla específica de gobernanza ética de IA en instituciones GLAM.
- El fallback local incorpora un perfil semántico para `revisor-gobernanza-ia-glam`.
- Se corrige una duplicación accidental en la comprobación de disponibilidad de Ollama durante la mejora de instrucciones.

## Resultado esperado

Las skills generadas deberían ser menos genéricas y más fiables como instrucciones reutilizables. En particular, Compo debe evitar salidas que parezcan certificar cumplimiento legal o técnico cuando solo realizan una revisión preliminar basada en texto aportado.

## Limitación

Compo sigue dependiendo del modelo local seleccionado. Los modelos pequeños pueden omitir parte de las restricciones, por lo que se ha añadido también un posprocesado prudente para limpiar algunos patrones problemáticos frecuentes.
