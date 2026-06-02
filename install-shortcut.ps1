<#
  Compo · Instalador de acceso directo Windows
  Crea un acceso directo en el Escritorio con el icono de Compo.
  No instala servicios, no modifica el PATH y no copia archivos fuera de la carpeta actual.
#>

param(
  [string]$ShortcutName = "Compo Local Beta"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartBat = Join-Path $Root "start.bat"
$Icon = Join-Path $Root "assets\logo-compo.ico"

if (-not (Test-Path $StartBat)) {
  throw "No se encuentra start.bat en $Root"
}

if (-not (Test-Path $Icon)) {
  throw "No se encuentra el icono de Compo en $Icon"
}

$Desktop = [Environment]::GetFolderPath("DesktopDirectory")
$ShortcutPath = Join-Path $Desktop ("$ShortcutName.lnk")

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $StartBat
$Shortcut.WorkingDirectory = $Root
$Shortcut.IconLocation = $Icon
$Shortcut.Description = "Inicia Compo en local con Ollama opcional"
$Shortcut.WindowStyle = 1
$Shortcut.Save()

Write-Host ""
Write-Host "Acceso directo creado:" -ForegroundColor Green
Write-Host "  $ShortcutPath"
Write-Host ""
Write-Host "Puedes iniciar Compo desde el Escritorio con el icono de Compo."
