Construye un archivo SKILL.md completo, operativo y activable a partir del siguiente payload.

Objetivo: generar una Claude Agent Skill útil para activación automática. No basta con una plantilla formalmente válida: la metadata debe permitir que Claude seleccione la skill cuando el usuario formule una petición natural relacionada con su uso. El cuerpo debe ser procedimental, verificable y prudente.

Reglas de interpretación de la instrucción breve:
- Si la instrucción empieza con fórmulas como “quiero crear una skill”, “necesito una skill”, “skill para Claude que…”, no uses esa fórmula como name, title ni description. Extrae la capacidad real que aparece después.
- Convierte frases de intención del usuario en una función semántica concreta. Ejemplo: “quiero crear una skill para Claude que ayude a revisar descripciones archivísticas conforme a ISAD(G)” debe producir name: revisor-descripciones-archivisticas-isadg, no name: crear-una-skill-para-claude.
- La description no debe copiar literalmente la instrucción del usuario. Debe empezar con un verbo funcional en tercera persona: “Revisa…”, “Optimiza…”, “Clasifica…”, “Extrae…”, “Evalúa…”, “Normaliza…”.
- Antes de escribir el YAML, infiere internamente: tarea principal, objeto tratado, dominio profesional, disparadores naturales, límites, entradas, formato de salida y riesgos. No muestres esta inferencia; úsala para construir la skill.

Reglas críticas para el frontmatter YAML:
- Incluye, como mínimo: name, description, version y created.
- Puedes incluir when_to_use si refuerza la activación. Si lo incluyes, debe ser breve y complementar la description con casos de uso naturales.
- name debe ser breve, semántico, estable, en minúsculas, con guiones, sin espacios, sin acentos y preferiblemente por debajo de 64 caracteres.
- description es el campo más importante para discovery/activación. Debe describir qué hace la skill y cuándo usarla, en tercera persona, en una o dos frases específicas.
- Pon al principio de description el caso de uso principal. Después añade disparadores naturales que el usuario podría escribir: verbos, tareas, objetos y contextos.
- No uses descripciones genéricas como “Skill generada con Compo”, “revisar antes de uso operativo”, “ayuda con una tarea” o equivalentes. La procedencia de Compo no debe aparecer en la metadata.
- No incluyas en description advertencias largas, disclaimers ni condiciones que oculten el caso de uso. Los límites van en el cuerpo.
- Evita promesas absolutas en description: no uses “garantiza”, “certifica”, “valida cumplimiento”, “asegura conformidad” ni equivalentes salvo que el usuario haya aportado una capacidad técnica o jurídica real.

Reglas de precisión funcional:
- No conviertas una revisión orientativa en una certificación. Usa “revisa”, “evalúa preliminarmente”, “comprueba si contempla”, “identifica lagunas”, “señala riesgos” o “propone mejoras”.
- Evita lenguaje de cumplimiento formal salvo que la skill incluya un marco normativo aportado por el usuario y un procedimiento explícito. No uses “cumple / no cumple” como estado por defecto. Prefiere estados prudentes: “Adecuado”, “Parcial”, “Insuficiente”, “Ausente”, “No evaluable”.
- No inventes límites arbitrarios como número máximo de caracteres, idioma obligatorio, formatos exclusivos o restricciones no indicadas por el usuario.
- No excluyas casos útiles de forma innecesaria. Por ejemplo, no digas que no se usa si el documento ya fue revisado por un profesional; puede servir como segunda revisión o control de calidad.
- No prohíbas idiomas salvo que el usuario lo pida. Si el idioma impide revisar con seguridad, indica que debe pedirse aclaración, traducción o contexto.
- No digas que la skill procesa PDFs, imágenes, OCR, XML, bases de datos, catálogos o APIs si no hay scripts/recursos implementados. Puedes decir que trabaja sobre el contenido textual aportado por el usuario.
- Si el usuario aporta un documento o archivo en un entorno que permita leerlo, la skill puede trabajar sobre el contenido extraído por Claude, pero no debe prometer extracción técnica propia.
- No excluyas la skill porque el documento ya haya sido revisado por una persona profesional, un DPO o un perfil jurídico. Puede ser útil como segunda revisión, control de calidad o contraste preliminar; limita su alcance sin autoexcluirla.
- Las entradas esperadas no deben exigir que el usuario aporte una propuesta perfecta o una lista ya estructurada. Acepta texto original, versión tratada, propuesta parcial, criterios aplicados o cualquier combinación razonable.

Reglas específicas para privacidad, anonimización, seudonimización y protección de datos:
- La skill debe revisar suficiencia, proporcionalidad, trazabilidad, minimización de exposición y riesgos de reidentificación; no debe certificar cumplimiento legal ni decidir publicación.
- No ayudes a reidentificar personas, reconstruir datos ocultos, revertir anonimización ni combinar pistas para inferir identidades.
- **Lista de capacidades técnicas que NO deben aparecer en la skill, ni como funcionalidad propia ni como input que se pide al usuario**: cálculo de hashes (SHA-256 u otros), firmas digitales, sellos de tiempo, sellos de conformidad, generación de identificadores criptográficos, semillas seudoaleatorias, registros de auditoría con integridad criptográfica, consultas automáticas a registros oficiales (BOE, Consejo de Transparencia, AEPD, registros de actividades de tratamiento, sedes electrónicas, etc.), acceso a bases de datos externas, ejecución de validadores oficiales. Si el usuario las menciona en su instrucción, la skill debe **declinar explícitamente** esas funcionalidades en una sección específica del cuerpo (no fingir que las realiza, no fingir que las incluye en su tabla pidiendo al usuario que las aporte por su cuenta), explicar por qué una skill instructiva no puede hacerlas, y redirigir al usuario al instrumento adecuado (cliente de firma electrónica, herramienta criptográfica, consulta directa al registro). Esta regla es **absoluta**: no admite excepción "si el usuario la pide".
- En lugar de técnicas criptográficas o de implementación, recomienda criterios documentales: generalización, supresión, enmascaramiento, seudónimo estable controlado, registro de decisiones, revisión por responsable y minimización de repetición de datos sensibles.
- Si se mencionan datos personales o sensibles en ejemplos, usa marcadores ficticios y minimizados: [NOMBRE], [DIRECCIÓN], [FECHA], [ID]. No uses nombres reales, direcciones verosímiles, fechas exactas innecesarias ni datos que parezcan recuperables.
- Cuando sea necesario citar evidencia, usa fragmentos mínimos, parcialmente enmascarados o descripciones de evidencia. No reproduzcas datos sensibles completos salvo que sea imprescindible para la revisión y el usuario los haya aportado.
- En guardrails debe aparecer explícitamente que no se facilita reidentificación ni reconstrucción de datos ocultos.
- En el formato de salida de revisiones de anonimización debe incluirse, como mínimo: tipo de dato, evidencia mínima o enmascarada, estado, riesgo de reidentificación, recomendación, prioridad y confianza.
- Evita preguntas de verificación que pidan detalles técnicos peligrosos o innecesarios —por ejemplo, semillas, claves, hashes, identificadores completos o mecanismos para revertir sustituciones—. Formula preguntas sobre finalidad, acceso, contexto documental, criterio aplicado, trazabilidad de decisiones y revisión responsable.

Reglas específicas para verbos de la instrucción del usuario que la skill debe rechazar:

Si la instrucción del usuario incluye alguno de estos verbos (en la propia instrucción, no en una cita de un texto a revisar), la skill debe contener una sección "Lo que la skill NO hace" donde declina esa funcionalidad explícitamente y reformula a una variante prudente:

- "garantiza" o "garantizar" → reformular como "ayuda a revisar".
- "certifica" o "certificar" → reformular como "produce un informe preliminar".
- "valida cumplimiento" o "valida conformidad" → reformular como "señala posibles incoherencias para revisión humana".
- "emite sello" o "emite certificado" → declinar; no es una funcionalidad de una skill.
- "firma" o "firma digital" → declinar; remitir a herramienta de firma electrónica.
- "bloquea automáticamente" o "deniega automáticamente" → declinar; reformular como "recomienda al revisor".
- "reemplaza a [rol profesional]" (DPO, archivero, jurídico, secretario, interventor, ...) → declinar explícitamente; la skill apoya, no reemplaza.

La sección "Lo que la skill NO hace" debe ser visible en el cuerpo del SKILL.md y no diluirse en una nota a pie. La skill puede llamarse igual que pide el usuario en términos generales (revisor, evaluador, auditor preliminar), pero el comportamiento se ajusta a lo que una skill puede hacer realmente.

Reglas específicas para denominaciones de sistemas externos:

- Cuando el usuario menciona un sistema, registro o autoridad externa concreta (Consejo de Transparencia, BOE, AEPD, ENS, Junta de Castilla y León, Comisión de Valoración Documental, etc.), no inventes su denominación técnica ni sus procedimientos.
- Si conoces con seguridad la denominación exacta del sistema, úsala. Si tienes dudas razonables sobre la denominación, los procedimientos o las atribuciones del sistema, redirige al usuario para que aporte la referencia exacta o consulte la fuente directamente.
- No introduzcas denominaciones inventadas como "registro controlado", "base de datos central de transparencia", "sistema de validación oficial" si no son los nombres reales del sistema. Es preferible decir "el registro o sistema correspondiente, según indicación del usuario".

Reglas específicas para portabilidad de la skill:

- La skill debe ser **utilizable en distintas plataformas de IA**, no solo en Claude. El cuerpo de la skill no debe asumir ningún ejecutor concreto.
- Habla del ejecutor como "el asistente" o "el modelo" en lugar de "Claude" cuando te refieras genéricamente al sistema que ejecuta la skill. La marca "Claude" puede aparecer en el contexto si el usuario lo pide expresamente o si la instrucción menciona Claude Agent Skills como formato de origen.
- Si el modo portable está activado en el payload (campo `portable: true`), refuerza esta regla: en ese caso no menciones "Claude" en absoluto, no asumas Artifacts ni capacidades específicas de claude.ai, y mantén el frontmatter en su forma mínima (`name`, `description`, `compatibility`).
- El campo opcional `compatibility` del frontmatter, cuando aparezca, debe enumerar plataformas concretas (ej. `claude.ai, ChatGPT, asistentes locales con Ollama`).

Reglas críticas para el cuerpo del SKILL.md:
- No incluyas una sección “Instrucción base del usuario” salvo que el usuario lo pida expresamente. La skill final debe ser reusable, no un volcado del formulario.
- Cuerpo centrado en procedimiento real: propósito, cuándo usar, cuándo no usar, entradas esperadas, flujo de trabajo, formato de salida, criterios de calidad, guardrails, limitaciones técnicas, ejemplos y revisión humana cuando proceda.
- Incluye señales de activación o trigger phrases dentro de “Cuándo usar esta skill” solo si son específicas y naturales.
- Distingue claramente entre capacidades instructivas y capacidades técnicas. Si la skill no incluye scripts, no prometas conteo exacto de tokens, llamadas API, validaciones automáticas, pruebas unitarias, OCR, conversión de archivos, acceso a bases de datos ni ejecución externa.
- Si la necesidad implica cálculo, medición o transformación técnica exacta, añade una sección “Limitaciones técnicas” y explica qué puede hacerse sin scripts y qué requeriría scripts auxiliares.
- No pidas API keys, credenciales ni secretos. Una skill de Claude no debe solicitar claves para funcionar como instrucción.
- No inventes herramientas, rutas, archivos auxiliares o dependencias que no estén declaradas en el payload.
- No inventes datos factuales, normativas o capacidades no aportadas por el usuario.
- Si faltan datos críticos, incorpora preguntas de verificación dentro de la skill, no fuera de ella.

Reglas para formato de salida de la skill:
- Cuando la skill evalúe, revise o audite contenido, el formato de salida debe incluir una tabla con evidencia textual o indicación de ausencia de evidencia.
- La tabla debe obligar a separar: dimensión/campo, estado, evidencia aportada, problema o laguna, recomendación, prioridad o confianza cuando proceda.
- Si falta evidencia, el resultado esperado debe usar fórmulas como “No consta”, “No evaluable con la información aportada” o “Pendiente de verificación”.
- No permitas que los ejemplos contradigan los guardrails. Nunca inventes fechas exactas, autoridades, productores, obligaciones normativas, datos técnicos o conclusiones de cumplimiento en los ejemplos.

Reglas específicas para dominios GLAM, archivística, documentación, patrimonio o gobernanza de IA:
- Usa terminología profesional precisa y prudente.
- En archivística, evita errores de campo como “producto” cuando corresponda “productor” o “nombre del/de los productor(es)”.
- En gobernanza de IA, evita “garantizar cumplimiento”. Formula la tarea como revisión de cobertura, madurez, lagunas, riesgos y recomendaciones.
- En documentos de gobernanza ética, usa dimensiones como transparencia, supervisión humana, sesgos/equidad, protección de datos, propiedad intelectual, seguridad, trazabilidad, explicabilidad, impacto en usuarios, responsabilidad institucional, revisión periódica y gestión de incidencias, si son pertinentes.
- No conviertas marcos como GDPR, AI Act, NIST, UNESCO u otros en obligaciones concretas si el usuario no los ha aportado expresamente.

Estructura recomendada:
---
name: nombre-semantico-breve
description: Descripción específica en tercera persona con caso de uso principal y disparadores naturales de activación.
when_to_use: Casos concretos de uso, si refuerzan la activación sin alargar demasiado la metadata.
version: 0.1.0
created: YYYY-MM-DD
---

# Título legible

## Propósito

## Cuándo usar esta skill

## Cuándo no usar esta skill

## Entradas esperadas

## Flujo de trabajo

## Formato de salida

## Criterios de calidad

## Guardrails

## Limitaciones técnicas
Incluye esta sección cuando la skill pueda parecer que promete una capacidad técnica no implementada.

## Ejemplos de uso

## Revisión humana
Incluye esta sección cuando exista riesgo institucional, profesional, jurídico, documental, reputacional o de publicación.

Antes de entregar, revisa internamente la salida y corrige estos fallos si aparecen: name accidental, description genérica, lenguaje de garantía/certificación, estados "cumple/no cumple" sin marco formal, límites arbitrarios, ausencia de evidencia textual en la tabla, ejemplos con datos inventados, petición de credenciales o promesa de capacidades técnicas no implementadas, columnas de tabla que pidan al usuario un hash o una firma, denominaciones inventadas de registros oficiales, referencias a "Claude" en cuerpo de skills marcadas como portables.

Devuelve exclusivamente el contenido final del SKILL.md, sin bloque de código, sin explicación introductoria y sin comentario posterior.

{{BUILDER_PAYLOAD}}
