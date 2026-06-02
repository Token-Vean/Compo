# Changelog · Compo v0.1.6

## Objetivo

Mejorar la calidad real de las skills generadas, especialmente cuando Ollama no completa la generación y Compo debe recurrir al fallback local.

## Cambios principales

- El payload enviado a Ollama ya no incluye el borrador local de respaldo. Esto reduce tokens, evita contaminar la salida con una plantilla genérica y disminuye el riesgo de timeout en modelos pequeños.
- `prompts/build-skill.md` incorpora reglas explícitas para descartar fórmulas como “quiero crear una skill para Claude que…” y extraer la capacidad real.
- `prompts/system.md` refuerza que la skill no debe copiar literalmente la instrucción del usuario en `name`, `title` o `description`.
- El fallback local genera perfiles semánticos más útiles para casos frecuentes: revisión de descripciones archivísticas ISAD(G) y optimización de prompts para Claude.
- El fallback local evita nombres accidentales como `crear-una-skill-para-claude-que-ayude-a`.
- El timeout de generación con Ollama pasa de 60 a 180 segundos.
- Los errores por timeout se muestran con un mensaje más claro y accionable.

## Resultado esperado

Ante una instrucción como “Quiero crear una skill para Claude que ayude a revisar descripciones archivísticas conforme a ISAD(G)”, la salida local de respaldo debe aproximarse a:

```yaml
name: revisor-descripciones-archivisticas-isadg
description: "Revisa, normaliza y mejora descripciones archivísticas conforme a ISAD(G)..."
```

En lugar de copiar la frase inicial del usuario como nombre o descripción.
