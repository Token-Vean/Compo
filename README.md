<p align="center">
  <img src="https://github.com/Token-Vean/Compo/blob/main/Compo.png" alt="Compo — Motor local para componer prompts, agentes y skills" width="600">
</p>
# Compo

**Motor local para componer prompts, agentes y skills** con asistencia IA opcional. Sin telemetría, sin servicios externos.

Versión: 0.1.13 (beta pública source-available)

---

> **Aviso de licencia**: este repositorio se publica como código disponible para revisión, evaluación y transparencia. **Compo no es software open source**. La redistribución pública, publicación de versiones modificadas, reventa, sublicencia o integración comercial requieren autorización escrita de Víctor Villapalos Pardiñas. Consulta `LICENSE` y `NOTICE`.

## ¿Qué es esto?

Compo es una herramienta local para construir tres tipos de artefactos de IA:

- **Prompts**: instrucciones puntuales, completas y verificables.
- **Agentes**: asistentes especializados con identidad, propósito, tareas, límites y formato de respuesta.
- **Skills**: capacidades reutilizables en formato `SKILL.md`.

La diferencia principal de esta versión es que el usuario ya no tiene que rellenar un formulario técnico completo para obtener valor. La entrada principal es ahora una **instrucción breve en lenguaje natural**. Si Ollama está activo, Compo transforma esa instrucción en un prompt, agente o skill profesional. Si Ollama no está disponible, Compo genera una estructura local de respaldo sin IA.

Este diseño mantiene la versión web sin IA como herramienta manual/formativa, mientras que la versión local con Ollama actúa como asistente para usuarios que no saben todavía cómo formular todos los campos técnicos.

---

## Arranque

### Linux / macOS

```bash
./start.sh
```

### Windows

Doble clic en `start.bat` o desde una terminal:

```cmd
start.bat
```

Se abrirá `http://127.0.0.1:8765/compo.html` en el navegador. Puedes cerrar la sesión desde el botón **Apagar** de la interfaz o con Ctrl+C en la terminal.

### Acceso directo con icono en Windows

La distribución incluye el icono de Compo en `assets/logo-compo.ico`. Para crear un acceso directo en el Escritorio con ese icono, ejecuta:

```cmd
install-shortcut.bat
```

Esto no instala servicios ni modifica el sistema. Solo crea un acceso directo a `start.bat` usando el icono de Compo.

**Requisitos**: Python 3. El servidor solo escucha en `localhost`: nadie de tu red ni de internet puede acceder.

### ¿Por qué necesita un servidor?

Por las políticas de seguridad estrictas de Compo (CSP). Abrir `compo.html` directamente como archivo (`file://`) puede romper la carga de idiomas y la conexión con Ollama. El servidor local evita ese problema sin exponer la herramienta al exterior.

---

## Flujo de uso recomendado

1. Elegir **Prompt**, **Agente** o **Skill**.
2. Escribir una instrucción natural: qué se quiere construir, para quién, con qué límites y en qué contexto.
3. Opcionalmente abrir **Campos avanzados opcionales** para fijar nombre, formato, audiencia, restricciones o guardrails.
4. Pulsar **Generar**.
5. Revisar el resultado, editarlo si procede, copiarlo o descargarlo.
6. Si el resultado no encaja, usar **Regenerar** para obtener una variante diferente o **Revisar** para generar una auditoría crítica.
7. Usar **Borrar** para limpiar solo el resultado de la tipología actual, o **Borrar todo** para eliminar instrucciones, resultados, revisiones e historial de toda la sesión.
8. Al terminar, usar **Apagar** para cerrar el servidor local iniciado con `start.bat` o `start.sh`.

Ejemplo para Skill:

> Necesito una skill para descripción archivística ISAD(G). Debe trabajar con transcripciones de documentos, proponer campos descriptivos, separar evidencia literal e inferencias, estimar confianza y exigir revisión profesional.

Compo debe convertir esa intención en un `SKILL.md` completo, no limitarse a repetir los campos introducidos.


## Criterios específicos para skills

Desde Compo v0.1.4, una skill no se considera buena solo porque tenga frontmatter YAML válido. El generador intenta producir skills más activables y reutilizables:

- `name` debe ser breve, semántico, estable, en minúsculas y con guiones.
- `description` debe explicar qué hace la skill y cuándo usarla con palabras que el usuario escribiría de forma natural.
- La description no debe decir “Skill generada con Compo” ni centrarse en la procedencia del archivo.
- El cuerpo debe describir un procedimiento operativo, no copiar la instrucción inicial del usuario.
- Si no hay scripts auxiliares, la skill no debe prometer mediciones exactas, llamadas API, OCR, validaciones automáticas ni ejecución técnica.
- La skill no debe pedir API keys, credenciales ni secretos.

---

## Asistencia IA con Ollama (opcional)

Compo funciona sin Ollama, pero su utilidad principal en esta versión es la asistencia local.

1. Instala Ollama: ver `docs/INSTALAR-OLLAMA.es.md`.
2. Asegúrate de que el servicio está corriendo (`ollama serve` o el icono de Ollama).
3. Abre Compo. La franja de estado indicará si Ollama está activo.
4. Si no tienes ningún modelo descargado, entra en "Modelo IA local" y descarga uno de los recomendados.

### Modelos recomendados

| Modelo        | Tamaño aproximado | Uso recomendado |
| ------------- | ----------------- | --------------- |
| `gemma4:e2b`  | ~7.2 GB           | Opción ligera actual para equipos modestos; 128K de contexto |
| `gemma4:e4b`  | ~9.6 GB           | Equilibrio recomendado para uso general; 128K de contexto |
| `gpt-oss:20b` | ~14 GB            | Mayor capacidad de razonamiento y auditoría; recomendado para 16 GB de RAM o más |
| `qwen3:8b`    | ~5.2 GB           | Alternativa robusta para tareas multilingües e instruccionales |

Otros modelos descargados manualmente con `ollama pull` también se detectan y pueden usarse como modelo activo.

---

## Estructura del proyecto

```
compo-v0.1/
├── compo.html              ← entrada principal
├── start.sh / start.bat    ← arranque local
├── install-shortcut.bat    ← crea acceso directo Windows con icono de Compo
├── install-shortcut.ps1    ← script PowerShell usado por el instalador de acceso directo
├── server.py               ← servidor local con endpoint de apagado
├── css/                    ← tokens de diseño + componentes + pantallas
├── js/
│   ├── theme.js            ← tema claro/oscuro/auto
│   ├── i18n.js             ← idioma ES/EN
│   ├── router.js           ← navegación
│   ├── ollama.js           ← cliente Ollama: detectar, listar, descargar y generar
│   ├── security.js         ← sanitización, detector PII, envoltorios seguros para LLM
│   └── compo.js            ← builder asistido, plantillas y exportación
├── i18n/                   ← cadenas ES/EN
├── prompts/                ← prompts internos editables
├── plantillas/             ← plantillas JSON por tipología
├── assets/                 ← logo SVG/PNG/ICO
├── online/                 ← CSS adaptado para la versión online/manual
└── docs/                   ← documentación
```

La versión 0.1.13 mantiene la estructura modular parcial de v0.1.3, conserva el apagado local de v0.1.5 y refuerza la generación de skills operativas. Además de mejorar `name`, `description` y `when_to_use`, endurece el cuerpo de la skill para evitar lenguaje de certificación, promesas absolutas, límites arbitrarios, tablas sin evidencia y recomendaciones técnicas no implementadas. En skills de anonimización, seudonimización o protección de datos, el generador exige no facilitar reidentificación, minimizar evidencia sensible, evitar reconstrucción de datos ocultos y distinguir revisión preliminar de validación legal. Los prompts internos están en `/prompts/` y las plantillas en `/plantillas/`. Se mantiene un único `compo.js` para no sobrerrefactorizar antes de cerrar la beta funcional, pero ya queda preparado el camino para separar en módulos `compo-ai.js`, `compo-builder.js` y `compo-templates.js` si el proyecto crece.

---

## Documentación rápida

- `docs/PRIMER-ARRANQUE.es.md`: guía breve para abrir Compo por primera vez, especialmente en Windows.
- `docs/INSTRUCCIONES-USO.es.md`: flujo de trabajo recomendado.
- La propia aplicación incluye pantallas internas de **Uso** y **Licencia**.

## Licencia

Desde v0.1.13, Compo deja de distribuirse bajo MIT y pasa a utilizar una licencia beta restrictiva de uso. El titular es Víctor Villapalos Pardiñas y la web de referencia es `https://www.victorvillapalos.es`. Consulta `LICENSE` para el texto completo.

## Estado actual

**Funciona ya:**

- Tarjetas de Prompt, Agente y Skill habilitadas.
- Builder asistido basado en una instrucción breve.
- Campos avanzados opcionales colapsados por defecto.
- Modo experto: muestra los campos avanzados abiertos.
- Generación con Ollama mediante `/api/generate`.
- Fallback estructurado sin IA.
- Plantillas iniciales que rellenan la instrucción breve, no todo el formulario.
- Exportación Markdown y `SKILL.md`.
- Copia al portapapeles.
- Regeneración de variantes.
- Borrado del resultado por tipología y borrado completo de sesión.
- Revisión crítica del resultado generado.
- Historial breve de versiones por Prompt, Agente y Skill.
- Exportación/importación de proyecto local en JSON.
- Prompts internos externalizados en `/prompts/`.
- Plantillas externalizadas en `/plantillas/`.
- Generación de skills con `name` breve, `description` orientada a activación automática y cuerpo operativo.
- Reglas específicas para skills de anonimización, seudonimización y protección de datos: no reidentificación, evidencia mínima/enmascarada, no reconstrucción de datos ocultos y rechazo de recomendaciones técnicas no implementadas.
- Prohibición en prompts internos de prometer capacidades técnicas no implementadas, como conteo exacto de tokens, OCR, llamadas API o scripts inexistentes.
- Detección heurística de PII antes de descargar.
- Gestión básica de modelos Ollama: detectar, actualizar lista, elegir y descargar. Por seguridad operativa, Compo no borra modelos locales desde la interfaz.
- Botón **Apagar** que detiene el servidor local de Compo cuando se ha arrancado con `start.bat` o `start.sh`.

**Pendiente para beta más sólida:**

- Importar y auditar `SKILL.md` existentes.
- Añadir una puntuación específica de calidad para `SKILL.md`.
- Añadir comparación visual entre versiones generadas.
- Incorporar tests de UI con Playwright.
- Separar `compo.js` en módulos internos cuando el comportamiento esté estabilizado.
- Crear empaquetado de escritorio con Tauri o similar para usuarios no técnicos.

---

## Privacidad y seguridad

- Sin conexiones de red salvo a Ollama local (`http://localhost:11434` y `http://127.0.0.1:11434`).
- Sin telemetría.
- CSP restrictiva.
- Persistencia mínima: tema, idioma y modelo activo.
- El botón **Apagar** solo llama a `POST /__compo_shutdown` en el servidor local de Compo; no apaga Ollama ni ningún servicio del sistema.
- Los textos generados solo se conservan en pantalla hasta que el usuario los copie o descargue.
- Advertencia heurística si el resultado parece contener DNI/NIE, IBAN, correo, teléfono o identificadores de expediente.

Más detalle en `docs/PRIVACIDAD.es.md` y `docs/SEGURIDAD.es.md`.
