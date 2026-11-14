@echo off
title Sincronizar con GitHub
cd /d "%~dp0"

echo ======================================================
echo    SINCRONIZANDO CAMBIOS CON GITHUB
echo ======================================================
echo.

if not exist ".git" (
    echo [1/3] Inicializando repositorio Git local...
    git init
    git branch -M main
    echo.
    echo Por favor escribe o pega la URL de tu repositorio de GitHub
    echo Ejemplo: https://github.com/carpro798/kawaii.git
    set /p REPO_URL="Pega tu URL aqui: "
    git remote add origin %REPO_URL%
)

echo.
echo [2/3] Preparando archivos y cambios...
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
