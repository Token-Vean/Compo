@echo off
REM Elimina el acceso directo de Compo creado en el Escritorio.
setlocal
set SHORTCUT=%USERPROFILE%\Desktop\Compo Local Beta.lnk
if exist "%SHORTCUT%" (
  del "%SHORTCUT%"
  echo Acceso directo eliminado: %SHORTCUT%
) else (
  echo No se ha encontrado el acceso directo en el Escritorio.
)
pause
endlocal
