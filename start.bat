@echo off
REM ===========================================================================
REM Compo - Arranque Windows
REM Levanta el servidor local de Compo en 127.0.0.1:8765, abre la aplicacion
REM y permite apagar la sesion desde la propia interfaz.
REM ===========================================================================

setlocal
set PORT=8765
set HOST=127.0.0.1
set URL=http://%HOST%:%PORT%/compo.html

cd /d "%~dp0"

REM Comprobar Python 3.
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo.
  echo   X Python no esta instalado o no esta en el PATH.
  echo     Compo necesita Python 3 para servir los archivos estaticos.
  echo     Descargalo desde https://www.python.org/downloads/
  echo.
  pause
  exit /b 1
)

echo.
echo   Compo - servidor local
echo   ----------------------
echo   URL:    %URL%
echo   Puerto: %PORT%
echo.
echo   Puedes apagar Compo desde la interfaz o con Ctrl+C.
echo.

REM Abrir el navegador (con un pequeno retraso).
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start """" %URL%"

REM Servir solo en localhost. server.py añade el endpoint /__compo_shutdown
REM usado por el boton "Apagar" de la interfaz.
python server.py --host %HOST% --port %PORT%

endlocal
