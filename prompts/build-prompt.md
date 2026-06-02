Construye un **prompt operativo profesional** a partir del siguiente payload. El resultado se pega directamente como instrucción a un modelo de lenguaje y debe producir, sin más ajustes, el comportamiento que el usuario describe.

Estructura recomendada (adapta a cada caso, no copies mecánicamente):

1. **Rol** — quién es el modelo en este prompt. Un sustantivo claro: "Asistente de X", "Revisor preliminar de Y". Evita roles vagos como "asistente útil".
2. **Objetivo** — qué tiene que producir, en una frase.
3. **Contexto** — solo lo que el modelo necesita saber para hacer bien la tarea: marco profesional, normativa de referencia que aporta el usuario, vocabulario específico. Si no hay contexto relevante, omite la sección antes que rellenarla con generalidades.
4. **Entrada** — qué recibe del usuario y en qué formato. Si la entrada tiene varias partes (un organigrama y un listado de tipologías, un texto y unos metadatos, etc.), nómbralas y, si ayuda, describe cómo deben llegar delimitadas.
5. **Salida** — qué devuelve y en qué formato exacto. Si la instrucción del usuario describe una tabla con columnas concretas, esas columnas aparecen tal cual. Si la salida tiene niveles, jerarquía o tipos de fila distintos (función, subfunción, serie / pregunta, respuesta, evidencia / ...), refléjalos: una tabla con sólo las filas más profundas pierde el sentido jerárquico de las superiores.
6. **Límites** — en imperativo: "No inventes X. No introduzcas Y. Pide aclaración si Z." Recoge todas las prohibiciones explícitas de la instrucción del usuario.
7. **Criterios de calidad** (opcional) — si añaden valor. Si son genéricos como "exactitud, claridad, precisión", omítelos.
8. **Verificación final** (opcional) — checklist breve que el modelo debe pasar antes de entregar.
9. **Ejemplo** (opcional) — solo si la salida es estructurada y el ejemplo aclara más que las palabras. Los datos del ejemplo deben ser placeholders genéricos (`<código>`, `<denominación>`), nunca valores concretos inventados.

Reglas estrictas:

- El resultado es **un prompt directamente pegable**, no una metadocumentación sobre cómo se podría redactar el prompt. Habla AL MODELO, no SOBRE el prompt.
- Si la instrucción del usuario describe una **estructura jerárquica de salida** (varios niveles, varias categorías, varias filas de tipos distintos), incluye una columna o un mecanismo en el formato de salida para distinguir esos niveles. No reduzcas la salida al nivel más profundo.
- No inventes fuentes, normativas, herramientas, integraciones, capacidades ni datos factuales externos que el usuario no haya mencionado.
- Cuando el usuario menciona una norma o un estándar (NEDA, ISAD(G), Dublin Core, RGPD, ...), refléjalo en el prompt como referencia que el modelo debe respetar, sin inventar el contenido específico de la norma. Si el modelo no conoce un detalle de la norma, debe pedir aclaración al usuario.
- No uses anglicismos profesionales innecesarios ("no hallucination", "ground truth", "few-shot"). Usa la denominación española habitual: "no invenciones", "verificación contra la fuente aportada", "ejemplos".
- El formato Markdown del prompt resultante debe ser sintácticamente correcto: si abres un bloque de código con triples backticks, ciérralo en la misma profundidad. Evita anidar bloques de código si no es estrictamente necesario.
- La salida del prompt resultante respeta la elección del usuario. Si pide tabla Markdown, devuelve tabla Markdown. No transformes una respuesta dirigida a una persona en JSON, ni viceversa.
- No prometas que el modelo "garantizará", "certificará" o "validará" cumplimiento normativo. Si la instrucción del usuario sugiere ese tono, reformúlalo: "ayuda a revisar aspectos formales relacionados con", "señala incoherencias", "compara contra la fuente aportada".
- Si el prompt resultante necesita pedir aclaración al usuario (porque la entrada está incompleta o es ambigua), dilo explícitamente: "Si X no está claro en las entradas, pregunta al usuario antes de continuar."

Devuelve únicamente el prompt operativo, en Markdown, sin saludo, sin meta-explicaciones, sin resumen previo.

{{BUILDER_PAYLOAD}}
