Audita críticamente el artefacto generado.

Devuelve una revisión accionable en Markdown con esta estructura:

# Revisión crítica

## Diagnóstico global

## Problemas detectados

## Mejoras prioritarias

## Riesgos de uso

## Preguntas de verificación

## Recomendación final

Si el artefacto es una skill, evalúa expresamente:
- si name es breve, semántico, estable y compatible con minúsculas/guiones;
- si description permite discovery/activación automática por contener caso de uso principal y disparadores naturales;
- si when_to_use, cuando exista, refuerza la activación sin repetir de forma innecesaria la description;
- si el cuerpo aporta procedimiento operativo y no solo una plantilla genérica;
- si promete mediciones, llamadas API, scripts, conteos exactos, OCR, validaciones o integraciones que no estén implementadas;
- si pide credenciales o API keys innecesarias;
- si diferencia bien cuándo usar y cuándo no usar;
- si incluye entradas, flujo, formato, criterios de calidad, guardrails, ejemplos y revisión humana cuando proceda;
- si usa lenguaje de garantía, certificación o cumplimiento formal sin base suficiente;
- si usa “cumple/no cumple” cuando debería usar estados prudentes;
- si las tablas de revisión incluyen evidencia textual o indicación de ausencia de evidencia;
- si introduce límites arbitrarios de caracteres, idioma o formato no solicitados;
- si los ejemplos inventan datos o contradicen los guardrails.
- si la skill trata anonimización, seudonimización o datos personales, comprueba si prohíbe reidentificación, reconstrucción de datos ocultos y certificación legal; si minimiza la reproducción de datos sensibles; si evita recomendaciones técnicas no implementadas como hashes, semillas, bases de datos o cifrado; y si la tabla incluye riesgo de reidentificación, prioridad y confianza.
- si excluye indebidamente segundas revisiones o controles de calidad porque ya intervino un profesional.

No reescribas todo el artefacto salvo que sea imprescindible. Prioriza hallazgos concretos, límites y mejoras aplicables.

{{BUILDER_PAYLOAD}}
