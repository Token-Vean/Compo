Construye el **prompt operativo** de un agente a partir del siguiente payload. El resultado se pega tal cual como instrucción de sistema del modelo: cuando alguien lo cargue, el modelo debe poder comportarse como ese agente sin necesidad de reescribir nada.

Importante: NO escribas una especificación, una ficha técnica ni una tabla descriptiva del agente. Escribe el prompt que se le da al agente, en segunda persona, en lenguaje directo y operativo.

Estructura recomendada del prompt resultante (adapta a cada caso, no copies mecánicamente):

1. **Identidad** — una frase en segunda persona: "Eres X, un agente que...".
2. **Misión** — qué produces y para quién, sin rodeos.
3. **Entradas que recibes** — qué te aporta el usuario y qué pides si falta. Si una entrada es imprescindible, dilo y pide que se aporte antes de empezar.
4. **Procedimiento** — pasos numerados. Lo que haces y en qué orden. Concreto.
5. **Casos o plantillas** — si la instrucción menciona varias situaciones que requieren tratamiento distinto (clasificación de solicitudes, tipos de documento, severidades, etc.), incluye una plantilla específica para cada una. Plantillas vacías o genéricas son peor que no incluir plantillas.
6. **Tono y registro** — cómo redactas. Solo si la instrucción lo pide o si el contexto institucional/profesional lo exige.
7. **Salida** — qué devuelves exactamente, con la estructura concreta. Evita formatos no pedidos por el usuario (no inventes JSON si la instrucción habla de una respuesta para una persona, ni inventes Markdown estructurado si pide un texto continuo).
8. **Límites** — en imperativo y segunda persona: "No firmas. No envías. No interpretas Derecho. No reemplazas al X". Recoge todas las exclusiones de la instrucción del usuario.
9. **Cuándo pedir aclaración y cuándo derivar** — diferencia entre lo que tú pides al usuario directamente y lo que escalas a otro rol profesional (servicio jurídico, DPO, archivero senior, etc.).
10. **Revisión humana** — una línea final recordando que tu salida no se publica/envía/firma sin revisión humana competente, si la instrucción lo sugiere.

Reglas estrictas:

- El prompt resultante habla EN SEGUNDA PERSONA al modelo destinatario ("Eres", "Recibes", "Produces"), no DEL agente en tercera persona ("El agente analiza...").
- No inventes capacidades técnicas: memoria persistente entre conversaciones, acceso a bases de datos, ejecución de código, lectura de archivos, integración con sistemas externos. Si el usuario no las ha pedido o no existen scripts auxiliares, no aparecen en el prompt.
- No inventes el formato de salida. Si la instrucción describe el formato (texto, tabla, borrador, JSON), respétalo. Si no lo describe, elige el más natural para la tarea y dilo explícitamente, no por defecto JSON.
- No incluyas jerga técnica de NLP que no añade nada: "tokenización", "preprocesado del texto", "normalización Unicode" rara vez son útiles en un prompt operativo y pueden confundir al modelo.
- No prometas conformidad legal: nada de "garantiza", "certifica", "valida cumplimiento", "es conforme a la Ley X". Si la instrucción menciona normativa, redirige al usuario o al rol profesional correspondiente; el agente NO certifica.
- Si la instrucción menciona "memoria", "contexto persistente", "historial de interacciones": no inventes que el agente lo tiene. La memoria entre sesiones se gestiona fuera del prompt. Como mucho, di que el usuario puede aportar antecedentes al inicio de cada interacción.
- No introduzcas fuentes, normativas, herramientas, registros oficiales o sistemas externos que el usuario no haya nombrado expresamente. Si los nombra, no inventes denominaciones técnicas; si no estás seguro de la denominación exacta, pide al usuario que la aporte en lugar de improvisar.
- No introduzcas verbos de coerción que el agente no puede cumplir: "bloquear automáticamente", "denegar acceso", "cancelar expediente". El agente recomienda; las acciones coercitivas las decide la persona competente.
- El nombre del agente puede ser un acrónimo o un nombre simbólico solo si la instrucción lo sugiere. En otro caso, usa una denominación funcional ("Agente de revisión preliminar de X") y déjalo en el primer renglón de Identidad.

Devuelve únicamente el prompt operativo, en Markdown, sin saludo, sin meta-explicaciones.

{{BUILDER_PAYLOAD}}
