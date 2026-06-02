# Instalar y configurar Ollama para Compo

[Ollama](https://ollama.com) es un programa que ejecuta modelos de lenguaje en tu propia máquina. Compo lo usa como motor de IA. **Solo es necesario si quieres que Compo te asista con sugerencias y auditorías**: la composición manual funciona sin él.

## 1. Instalar Ollama

### macOS

Descarga el instalador `.dmg` desde [ollama.com/download](https://ollama.com/download), arrastra Ollama a `Aplicaciones`, ábrelo. Aparecerá un icono en la barra de menú. Eso significa que el servicio está corriendo.

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

El script instala Ollama y lo registra como servicio de systemd. Verifícalo con:

```bash
systemctl status ollama
```

### Windows

Descarga el instalador `.exe` desde [ollama.com/download](https://ollama.com/download) y ejecútalo. Ollama se instalará y arrancará como servicio en segundo plano.

### Verificar que funciona

Abre un navegador y entra en `http://localhost:11434/`. Deberías ver el mensaje:

> Ollama is running

Si lo ves, está listo.

## 2. Configurar el origen autorizado (importante)

Por defecto, Ollama acepta peticiones solo desde `localhost`. Como Compo se sirve desde `http://127.0.0.1:8765` o `http://localhost:8765`, conviene declararlo explícitamente para evitar bloqueos por CORS y reducir la superficie de ataque.

### macOS

Edita el plist de Ollama o, si usas la app nativa, el ajuste se aplica automáticamente cuando la app está abierta.

Para cambiarlo manualmente, en una terminal:

```bash
launchctl setenv OLLAMA_ORIGINS "http://127.0.0.1:8765,http://localhost:8765"
```

Y reinicia Ollama desde el icono de la barra de menú.

### Linux (con systemd)

```bash
sudo systemctl edit ollama.service
```

Añade:

```ini
[Service]
Environment="OLLAMA_ORIGINS=http://127.0.0.1:8765,http://localhost:8765"
```

Guarda, cierra y reinicia:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### Windows

1. Busca "Variables de entorno" en el menú Inicio.
2. Pulsa "Variables de entorno...".
3. Crea una nueva variable de usuario llamada `OLLAMA_ORIGINS` con valor `http://127.0.0.1:8765,http://localhost:8765`.
4. Cierra todas las ventanas pulsando Aceptar.
5. Reinicia Ollama (cierra el icono de la barra y vuelve a abrir Ollama).

### ¿Por qué no `OLLAMA_ORIGINS=*`?

Te lo encontrarás recomendado en muchos tutoriales. **No lo hagas** salvo que sepas exactamente lo que implica: convierte tu Ollama en un recurso accesible desde cualquier web abierta en tu navegador, lo que abre la puerta a ataques tipo DNS rebinding. Mantén el origen específico.

## 3. Descargar tu primer modelo

Aquí tienes dos opciones:

### Opción A · Desde Compo

1. Arranca Compo (`./start.sh` o `start.bat`).
2. Haz clic en la franja de la cabecera (te llevará a "Modelo IA local").
3. Elige uno de los modelos recomendados y pulsa "Descargar".
4. Compo te enseñará el progreso en tiempo real.

Esta es la forma más cómoda, especialmente si no estás familiarizado con la línea de comandos.

### Opción B · Desde la línea de comandos

```bash
ollama pull gemma3n:e2b
```

(o cualquier otro modelo). Tras descargarlo, recarga Compo y aparecerá en la lista.

## 4. Modelos recomendados para Compo

Compo usa el modelo principalmente para tres tareas: refinar redacción de campos, hacer auditorías de coherencia, y generar ejemplos. No necesita un modelo enorme.

| Modelo            | Tamaño  | Perfil                                                |
| ----------------- | ------- | ----------------------------------------------------- |
| `phi3.5:3.8b`     | ~2.2 GB | Mínimo viable. Para portátiles modestos.              |
| `gemma3n:e2b`     | ~5.6 GB | Equilibrio recomendado. 12-16 GB de RAM.              |
| `gemma3n:e4b`     | ~7.5 GB | Mejor calidad de generación. 16 GB de RAM o más.      |
| `qwen3:8b`        | ~5.2 GB | Alternativa robusta. 16 GB de RAM.                    |

Estos cuatro son los que Compo ofrece como descarga directa desde la pantalla "Modelo IA local". Si descargas otros manualmente con `ollama pull <modelo>`, Compo los detecta y aparecen también en la lista de modelos descargados, listos para usar como activos. La allowlist visible es una decisión de curaduría, no de seguridad: solo se ofrecen modelos que se han verificado que rinden bien con los prompts internos de Compo.

## 5. Solución de problemas

### Compo dice "Asistencia IA local no detectada"

- Verifica que Ollama está corriendo: `http://localhost:11434/` en el navegador.
- Si está en otro puerto distinto al 11434, Compo no lo encontrará todavía (en v0.1 el endpoint está fijo).
- Revisa que `OLLAMA_ORIGINS` no esté restringiendo a un origen distinto al 8765.

### El modelo tarda mucho

Es normal en la primera respuesta tras un periodo sin uso (Ollama tiene que cargar el modelo en RAM). Las siguientes respuestas son mucho más rápidas. Si el equipo tiene poca RAM, considera un modelo más pequeño.

### El navegador dice "blocked by CORS policy"

Indica que `OLLAMA_ORIGINS` no incluye `http://127.0.0.1:8765` o `http://localhost:8765`. Revísalo.

### Borrar todos los modelos

```bash
ollama list
ollama rm <nombre-modelo>
```

O desde Compo, en la pantalla de modelos.

## Apagar Compo

Desde Compo v0.1.5, si has iniciado la aplicación con `start.bat` o `start.sh`, puedes cerrar la sesión desde el botón **Apagar** de la interfaz. Esto detiene el servidor local de Compo y evita tener que cerrar la consola manualmente.

Este botón no apaga Ollama. Ollama puede seguir ejecutándose como servicio local para otras aplicaciones. Si quieres detener Ollama, hazlo desde sus propios controles o desde el sistema operativo.
