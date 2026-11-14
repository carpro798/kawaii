#!/usr/bin/env python3
"""
KAWAII ANIMES — Aplicación de Escritorio (Compatible con Linux y Windows)
Lanza el servidor de streaming y descargas en segundo plano,
y abre la aplicación en una ventana nativa independiente (Chrome / Brave / Edge en modo App).
"""
import os
import sys
import time
import socket
import shutil
import threading
import subprocess
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import server

def find_browser():
    """Busca navegadores compatibles tanto en Linux como en Windows."""
    # 1. En Windows
    if sys.platform.startswith("win"):
        candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\BraveSoftware\Brave-Browser\Application\brave.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        for b in ["chrome.exe", "msedge.exe", "brave.exe"]:
            p = shutil.which(b)
            if p:
                return p

    # 2. En Linux / Unix
    linux_candidates = [
        "google-chrome",
        "google-chrome-stable",
        "brave-browser",
        "brave",
        "chromium",
        "chromium-browser",
        "microsoft-edge",
        "microsoft-edge-stable",
        "firefox",
    ]
    for b in linux_candidates:
        p = shutil.which(b)
        if p:
            return p

    return None

def start_server_in_thread():
    server.socketserver.TCPServer.allow_reuse_address = True
    try:
        httpd = server.socketserver.TCPServer(("", server.PORT), server.KawaiiHandler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        return httpd
    except Exception as e:
        print(f"[KuroHoshi App] Nota sobre el puerto {server.PORT}: {e}")
        return None

def main():
    print("=" * 60)
    print("   🌸 KAWAII ANIMES — APLICACIÓN DE ESCRITORIO 🌸")
    print("   (Modo Linux & Windows | AdBlock Invisible Activado)")
    print("=" * 60)

    # Iniciar servidor local en segundo plano
    server_instance = start_server_in_thread()
    time.sleep(0.5)

    app_url = f"http://localhost:{server.PORT}"
    browser_exe = find_browser()
    profile_dir = os.path.join(BASE_DIR, ".app_profile")
    os.makedirs(profile_dir, exist_ok=True)

    if browser_exe:
        browser_name = os.path.basename(browser_exe)
        print(f"[KuroHoshi App] Abriendo ventana independiente con {browser_name}...")

        is_firefox = "firefox" in browser_name.lower()
        if is_firefox:
            cmd = [browser_exe, "--new-window", app_url]
        else:
            # Chromium / Chrome / Brave / Edge (modo PWA independiente)
            cmd = [
                browser_exe,
                f"--app={app_url}",
                f"--user-data-dir={profile_dir}",
                "--window-size=1280,820",
                "--autoplay-policy=no-user-gesture-required",
                "--disable-features=Translate",
                "--app-id=kawaiianimes"
            ]

        try:
            proc = subprocess.Popen(cmd)
            proc.wait()
            print("[KuroHoshi App] Ventana cerrada por el usuario. ¡Hasta pronto!")
            return
        except Exception as ex:
            print(f"[KuroHoshi App] Falló ejecución directa con {browser_name}: {ex}")

    # Fallback: navegador predeterminado del sistema (xdg-open en Linux)
    print("[KuroHoshi App] Abriendo en navegador predeterminado...")
    webbrowser.open(app_url)

    # Mantener el servidor en ejecución hasta que el usuario presione Ctrl+C
    print("\n[KuroHoshi App] Servidor activo en segundo plano. Presiona Ctrl+C para salir.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[KuroHoshi App] Cerrando aplicación...")

if __name__ == "__main__":
    main()
