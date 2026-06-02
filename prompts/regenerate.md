Genera una versión alternativa del artefacto actual.

Objetivo:
- mejorar precisión, estructura y utilidad;
- reducir formulaciones genéricas;
- conservar el propósito original;
- cambiar redacción y organización cuando mejore el resultado;
- no repetir literalmente la versión anterior salvo en elementos esenciales.

Si el artefacto es una skill:
- mejora especialmente name, description y when_to_use para activación automática;
- description debe contener el caso de uso principal y disparadores naturales que el usuario escribiría;
- elimina cualquier metadata genérica del tipo “generada con Compo”;
- evita prometer capacidades técnicas no implementadas;
- no pidas API keys ni credenciales;
- no incluyas la instrucción base del usuario como sección final salvo que sea imprescindible;
- evita lenguaje de garantía, certificación o cumplimiento formal si la skill solo hace revisión orientativa;
- no uses “cumple/no cumple” salvo que exista un marco formal aportado; prefiere “Adecuado”, “Parcial”, “Insuficiente”, “Ausente” o “No evaluable”;
- si revisa, audita o evalúa contenido, exige evidencia textual en la tabla de salida;
- elimina límites arbitrarios de caracteres, idioma o formato no solicitados;
- revisa que los ejemplos no inventen datos ni contradigan los guardrails.
- si trata anonimización, seudonimización o datos personales, añade guardrails contra reidentificación y reconstrucción de datos ocultos, minimiza evidencia sensible y evita recomendaciones técnicas no implementadas como hashes, semillas, bases de datos o cifrado si no se han pedido explícitamente.
- no excluyas usos de segunda revisión profesional o control de calidad por el hecho de que el documento ya haya pasado por otra revisión.

Devuelve solo la nueva versión completa del artefacto en Markdown.

{{BUILDER_PAYLOAD}}
