@echo off
title Kawaii Animes
cd /d "%~dp0"
python app.py
if %ERRORLEVEL% NEQ 0 (
    echo Iniciando servidor de respaldo...
    python server.py
)
pause

