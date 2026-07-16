@echo off
REM ===========================================================================
REM Compo - Arranque Windows (v0.1.14)
REM Levanta el servidor local de Compo en 127.0.0.1:8765, abre la aplicacion
REM y permite apagar la sesion desde la propia interfaz.
REM
REM v0.1.14: deteccion robusta de Python. En Windows, "python" puede ser el
REM alias de la Microsoft Store, que abre la tienda en lugar de ejecutar
REM Python. Se prueba primero el launcher oficial "py -3" y se verifica que
REM el interprete responde de verdad antes de usarlo.
REM ===========================================================================

setlocal
set PORT=8765
set HOST=127.0.0.1
set URL=http://%HOST%:%PORT%/compo.html
set PYCMD=

cd /d "%~dp0"

REM 1) Launcher oficial de Python (py -3): la opcion mas fiable en Windows.
py -3 --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
  set PYCMD=py -3
  goto :python_ok
)

REM 2) "python" en PATH, verificando que ejecuta de verdad (el alias de la
REM    Microsoft Store falla en --version en lugar de ejecutarse).
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
  set PYCMD=python
  goto :python_ok
)

echo.
echo   X Python 3 no esta instalado o no esta disponible.
echo     Compo necesita Python 3 para servir los archivos estaticos.
echo     Descargalo desde https://www.python.org/downloads/
echo     (marca "Add Python to PATH" durante la instalacion).
echo.
echo     Nota: si al escribir "python" se abre la Microsoft Store, ese
echo     acceso es un alias de Windows, no una instalacion real.
echo.
pause
exit /b 1

:python_ok
echo.
echo   Compo - servidor local
echo   ----------------------
echo   URL:    %URL%
echo   Puerto: %PORT%
echo.
echo   Puedes apagar Compo desde la interfaz o con Ctrl+C.
echo.

REM Abrir el navegador (con un pequeno retraso).
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" %URL%"

REM Servir solo en localhost. server.py incluye el endpoint /__compo_shutdown
REM usado por el boton "Apagar" de la interfaz.
%PYCMD% server.py --host %HOST% --port %PORT%

endlocal
