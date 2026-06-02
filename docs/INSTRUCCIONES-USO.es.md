# Compo · Instrucciones de uso

Compo es un asistente local para generar prompts, agentes y skills a partir de una instrucción breve.

## Flujo recomendado

1. Elige **Prompt**, **Agente** o **Skill**.
2. Escribe la necesidad en lenguaje natural.
3. Añade campos avanzados solo si necesitas fijar restricciones, formato, idioma, audiencia o límites.
4. Pulsa **Generar**.
5. Revisa y edita el resultado.
6. Usa **Regenerar** para obtener una variante.
7. Usa **Revisar** para auditar críticamente el resultado.
8. Copia, descarga o exporta el proyecto.

## Uso de Ollama

Compo utiliza Ollama solo si está disponible en local. No envía datos a servicios externos. Si no hay modelo activo, genera una estructura de respaldo sin IA.

## Modelos

Compo permite detectar, seleccionar y descargar modelos recomendados. Por seguridad operativa, no permite borrar modelos locales desde la interfaz.

## Revisión humana

Los artefactos generados deben revisarse antes de su uso profesional, institucional o docente. Las skills deben comprobarse especialmente en su `name`, `description`, `when_to_use`, criterios de no activación, guardrails y ejemplos.
