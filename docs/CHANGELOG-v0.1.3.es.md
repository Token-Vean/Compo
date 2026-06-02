# Changelog · Compo v0.1.3

Fecha: 2026-05-10

## Cambio de enfoque

La versión 0.1.3 consolida Compo como asistente local de composición. La entrada principal sigue siendo una instrucción breve en lenguaje natural, pero se mejora el flujo para que el usuario no tenga que cumplimentar formularios técnicos avanzados antes de obtener valor.

## Cambios principales

- Diseño responsive a pantalla completa.
- Cabecera persistente con navegación siempre visible entre Prompt, Agente y Skill.
- Botón **Generar** situado debajo del campo principal de instrucción.
- Estado independiente por tipología: Prompt, Agente y Skill conservan por separado su instrucción, resultado, revisión, nombre de archivo e historial.
- Al cambiar de tipología no se muestra el resultado generado en otra sección.
- Botón **Regenerar** para solicitar una variante alternativa del artefacto.
- Botón **Borrar** para eliminar solo el resultado de la tipología activa.
- Botón **Borrar todo** para limpiar toda la sesión local.
- Botón **Mejorar instrucción** para convertir una instrucción inicial débil en una petición más clara y accionable.
- Botón **Revisar** para generar una auditoría crítica del resultado actual.
- Historial breve de versiones por tipología.
- Exportación e importación de proyecto local en JSON.
- Botón **Actualizar modelos** en la pantalla de modelos Ollama.

## Arquitectura

- Se añade `/prompts/` para externalizar prompts internos:
  - `system.md`
  - `build-prompt.md`
  - `build-agent.md`
  - `build-skill.md`
  - `regenerate.md`
  - `critique.md`
  - `improve-instruction.md`
- Se añade `/plantillas/` con plantillas JSON separadas por tipología:
  - `prompt.templates.json`
  - `agent.templates.json`
  - `skill.templates.json`

## Seguridad y privacidad

- Se mantiene el funcionamiento local.
- No se añade telemetría.
- No se añade almacenamiento automático de instrucciones o resultados.
- La exportación/importación de proyecto queda bajo acción explícita del usuario.
- Se conserva la advertencia heurística de PII antes de descargar resultados.

## Pendiente

- Importación y auditoría de `SKILL.md` existentes.
- Puntuación específica de calidad para skills.
- Comparación visual entre versiones generadas.
- Tests automáticos de interfaz.
