# Compo · Primer arranque en Windows

Esta guía resume el primer uso de Compo en local.

## 1. Descomprimir

Descomprime el ZIP de Compo en una carpeta sencilla, por ejemplo:

```text
C:\Users\TU_USUARIO\Documents\Compo
```

Evita carpetas sincronizadas o protegidas si Windows muestra avisos de permisos.

## 2. Instalar Python

Compo necesita Python 3.8 o superior para servir la aplicación en local. Si no lo tienes instalado, instala Python desde la web oficial y marca la opción **Add Python to PATH** durante la instalación.

## 3. Instalar Ollama

Instala Ollama y comprueba que está funcionando. Compo se conecta a:

```text
http://localhost:11434
```

Si Ollama no está activo, Compo seguirá funcionando en modo estructurado sin IA.

## 4. Arrancar Compo

Haz doble clic en:

```text
start.bat
```

También puedes abrir una terminal en la carpeta de Compo y ejecutar:

```cmd
start.bat
```

La aplicación se abrirá en:

```text
http://127.0.0.1:8765/compo.html
```

## 4 bis. Crear acceso directo con icono de Compo en Windows

Si quieres iniciar Compo desde el Escritorio con el icono de Compo, ejecuta:

```cmd
install-shortcut.bat
```

El acceso directo apunta a `start.bat`, usa `assets/logo-compo.ico` y no instala servicios ni copia archivos fuera de la carpeta de Compo. Puedes eliminarlo después con:

```cmd
uninstall-shortcut.bat
```


## 5. Descargar o seleccionar modelo

En **Modelo IA local**, selecciona un modelo ya instalado o descarga uno recomendado. Compo permite seleccionar y descargar modelos, pero no borrarlos desde la interfaz.

## 6. Primer uso recomendado

1. Entra en **Skill**.
2. Escribe una instrucción breve, por ejemplo: “Crear una skill para revisar descripciones archivísticas ISAD(G), con evidencia, límites y revisión humana”.
3. Pulsa **Generar**.
4. Revisa el resultado.
5. Usa **Regenerar** si necesitas una variante o **Revisar** si quieres una auditoría crítica.

## 7. Cerrar Compo

Pulsa **Apagar** en la interfaz. Esto cierra el servidor local de Compo. Ollama no se apaga desde Compo porque puede estar siendo usado por otras aplicaciones.

## Problemas frecuentes

### El navegador no abre Compo

Comprueba que la consola no indica que el puerto 8765 está ocupado. Si lo está, cierra otra instancia o ejecuta:

```cmd
python server.py --port 8766
```

### Compo no detecta Ollama

Comprueba que Ollama está iniciado y que responde en `http://localhost:11434`. También puedes usar Compo sin Ollama, con generación local de respaldo.

### El modelo tarda demasiado

Prueba con un modelo más ligero, reduce la instrucción o utiliza **Regenerar**. Los modelos locales dependen mucho de la memoria y CPU/GPU disponible.
