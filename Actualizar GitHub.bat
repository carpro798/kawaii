@echo off
title Sincronizar con GitHub
cd /d "%~dp0"

echo ======================================================
echo    SINCRONIZANDO CAMBIOS CON GITHUB
echo ======================================================
echo.

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Conectando con tu repositorio de GitHub...
    echo.
    echo Por favor pega la URL de tu repositorio:
    echo Ejemplo: https://github.com/carpro798/kawaii.git
    set /p REPO_URL="Pega la URL aqui: "
    git remote add origin %REPO_URL%
)

echo.
echo [2/3] Guardando archivos y cambios...
git add .
git commit -m "Actualizacion automatica: mejoras del reproductor"

echo.
echo [3/3] Subiendo a GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo    EXITO: Repositorio y GitHub Pages actualizados!
    echo ======================================================
) else (
    echo.
    echo Si te aparece una ventana para iniciar sesion en GitHub,
    echo autorizala para permitir la subida.
)

echo.
pause
