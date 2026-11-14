#!/usr/bin/env bash
# =======================================================
# KAWAII ANIMES — Iniciar Aplicación de Escritorio (Linux)
# =======================================================
set -e
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
    exec python3 app.py "$@"
elif command -v python >/dev/null 2>&1; then
    exec python app.py "$@"
else
    echo "Error: Python 3 no está instalado en el sistema."
    exit 1
fi
