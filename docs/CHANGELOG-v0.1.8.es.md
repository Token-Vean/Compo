# Compo v0.1.8 · Skills con privacidad y no reidentificación

Fecha: 2026-05-10

## Cambios principales

- Refuerzo del generador de `SKILL.md` para casos de anonimización, seudonimización y protección de datos.
- Nueva regla: una skill no debe ayudar a reidentificar personas, reconstruir datos ocultos ni revertir anonimización.
- Nueva regla: las evidencias de salida deben minimizar datos personales y usar fragmentos enmascarados cuando proceda.
- Nueva regla: el generador no debe recomendar técnicas concretas no implementadas —por ejemplo, hashes, semillas, bases de datos, cifrado o auditorías técnicas— salvo que el usuario las pida expresamente y la skill incluya recursos auxiliares.
- Corrección de exclusiones indebidas: una skill puede servir como segunda revisión o control de calidad aunque un documento ya haya sido revisado por una persona profesional.
- Nuevo perfil local de fallback para `revisor-anonimizacion-documental`.
- Nueva plantilla externa `document-anonymization-skill`.
- Posprocesado local para reducir patrones problemáticos detectados en modelos pequeños: límites de texto plano demasiado rígidos, recomendaciones de hash/semilla, bases de datos de auditoría y exclusiones por revisión profesional previa.

## Resultado esperado

Las skills generadas para anonimización documental deben incluir `name` y `description` activables, tabla con evidencia mínima o enmascarada, riesgo de reidentificación, recomendación, prioridad y confianza; además deben prohibir certificación legal, reidentificación y reconstrucción de datos ocultos.
