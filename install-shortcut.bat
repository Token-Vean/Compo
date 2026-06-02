@echo off
REM ==========================================================================
REM Compo · Crear acceso directo en Windows
REM Crea un acceso directo en el Escritorio con el icono de Compo.
REM ===========================================================================

setlocal
cd /d "%~dp0"

echo.
echo   Compo - instalacion de acceso directo
echo   -------------------------------------
echo.

where powershell >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo   X PowerShell no esta disponible en este equipo.
  echo     Puedes iniciar Compo manualmente con start.bat.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-shortcut.ps1"
if %ERRORLEVEL% neq 0 (
  echo.
  echo   X No se pudo crear el acceso directo.
  echo     Puedes iniciar Compo manualmente con start.bat.
  echo.
  pause
  exit /b 1
)

echo.
pause
endlocal
