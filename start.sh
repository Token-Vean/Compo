#!/usr/bin/env bash
# ===========================================================================
# Compo · Arranque Linux/macOS
# Levanta el servidor local de Compo en 127.0.0.1:8765, abre la aplicación
# y permite apagar la sesión desde la propia interfaz.
# ===========================================================================

set -e

PORT=8765
HOST=127.0.0.1
URL="http://${HOST}:${PORT}/compo.html"

cd "$(dirname "$0")"

# Comprobar que tenemos Python 3 disponible.
if ! command -v python3 >/dev/null 2>&1; then
  echo ""
  echo "  ✗ Python 3 no está instalado o no está en el PATH."
  echo "    Compo necesita Python 3 para servir los archivos estáticos."
  echo "    Instálalo desde https://www.python.org/downloads/ o con tu gestor"
  echo "    de paquetes (apt install python3 / brew install python3 / etc.)."
  echo ""
  exit 1
fi

# Si Ollama no está corriendo, avisar (sin bloquear).
if ! curl -s --max-time 1 "http://${HOST}:11434/api/tags" >/dev/null 2>&1; then
  echo ""
  echo "  ⚠  Ollama no responde en http://${HOST}:11434"
  echo "     Compo arrancará igualmente, pero la asistencia IA no funcionará"
  echo "     hasta que Ollama esté ejecutándose. Consulta docs/INSTALAR-OLLAMA.es.md"
  echo ""
fi

# Abrir el navegador en segundo plano (sin bloquear si no hay GUI).
( sleep 1 && {
  if   command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1
  elif command -v open      >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1
  fi
} ) &

# Servir solo en localhost (no exponer en la red). server.py añade el endpoint
# /__compo_shutdown usado por el botón "Apagar" de la interfaz.
exec python3 server.py --host "$HOST" --port "$PORT"
