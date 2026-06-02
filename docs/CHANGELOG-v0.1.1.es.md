# Compo v0.1.1 · Cambios aplicados

## Correcciones funcionales

- Se habilitan las tarjetas de **Prompt** y **Agente** en la pantalla inicial.
- Se sustituye la pantalla aislada de Skill, que estaba basada en una maqueta de paso avanzado, por un **builder unificado** para Prompt, Agente y Skill.
- Skill se abre ahora en **Paso 1 de 4 · Definición inicial**, evitando el comportamiento anterior en el que parecía comenzar en una fase intermedia.
- Se añade generación real mediante Ollama usando el modelo activo local.
- Se añade fallback estructurado sin IA cuando Ollama no está disponible o no hay modelo activo.
- Se añaden plantillas operativas iniciales: verificador de calidad IA, compresor de respuestas, descripción ISAD(G) y agente de revisión documental.
- Se habilitan copia y descarga de resultados generados.
- La descarga de `SKILL.md` pasa por el detector heurístico de PII antes de guardar el archivo.

## Correcciones técnicas

- Se actualiza `router.js` para incluir la nueva pantalla `builder`.
- Se refactoriza `compo.js` para incorporar el builder unificado, validación de campos obligatorios, generación con Ollama, fallback local, exportación y plantillas.
- Se mejora `ollama.js` con timeout real de generación, propagación de errores HTTP y mayor límite de salida (`num_predict`) para skills.
- Se sustituyen referencias a modelos no válidos `gemma4:*` por modelos existentes en Ollama: `gemma3n:e2b`, `gemma3n:e4b`, `qwen3:8b` y `phi3.5:3.8b`.
- Se eliminan estilos inline del HTML para respetar mejor la CSP declarada.
- Se actualiza la documentación de CORS para contemplar tanto `http://127.0.0.1:8765` como `http://localhost:8765`.
- Se actualiza `SHA256SUMS.txt` con los hashes de la nueva distribución.

## Pendiente recomendado

- Implementar auditoría real de coherencia campo a campo.
- Añadir importación de `SKILL.md` existente.
- Añadir persistencia opcional cifrada o exportación/importación de borradores.
- Extraer la allowlist de modelos a `models.json` para no tocar código.
- Incorporar pruebas automatizadas de UI en CI.
- Añadir empaquetado de escritorio con Tauri o Electron si se busca distribución para usuarios no técnicos.
