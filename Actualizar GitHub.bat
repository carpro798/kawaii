@echo off
title Sincronizar con GitHub
cd /d "%~dp0"

echo ======================================================
echo    SINCRONIZANDO CAMBIOS CON GITHUB
echo ======================================================
echo.

echo [1/2] Guardando archivos y cambios...
git add .
git commit -m "Actualizacion automatica: mejoras del reproductor"

echo.
echo [2/2] Subiendo cambios a GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo    EXITO: Repositorio y GitHub Pages actualizados!
    echo ======================================================
) else (
    echo.
    echo Nota: Si GitHub te pide autorizar en una ventana del navegador,
    echo haz clic en Autorizar para permitir la subida.
)

echo.
pause
