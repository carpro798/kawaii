#!/usr/bin/env python3
"""
KAWAII ANIMES — Servidor de Streaming, Proxy Stealth Anti-Anuncios y Descargas
Compatible con Linux y Windows.
"""
import http.server
import socketserver
import socket
import os
import sys
import json
import shutil
import threading
import subprocess
import re
import urllib.request
import urllib.parse
import webbrowser

PORT = 3000
if getattr(sys, "frozen", False):
    BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    EXE_DIR = os.path.dirname(sys.executable)
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR = BUNDLE_DIR

BASE_DIR = BUNDLE_DIR
SITE_DIR = os.path.join(BUNDLE_DIR, "site")
DOWNLOADS_DIR = os.path.join(EXE_DIR, "descargas")
DOWNLOADS_INDEX = os.path.join(DOWNLOADS_DIR, "index.json")
ACTIVE_DOWNLOADS = {}   # key: "{animeId}_{ep}" → { status, progress }

os.makedirs(DOWNLOADS_DIR, exist_ok=True)

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def load_index():
    if os.path.exists(DOWNLOADS_INDEX):
        try:
            with open(DOWNLOADS_INDEX, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_index(entries):
    with open(DOWNLOADS_INDEX, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

def get_ffmpeg():
    # 1. En Windows, usar el ejecutable empaquetado si existe
    local_win = os.path.join(BUNDLE_DIR, "app", "resources", "ffmpeg.exe")
    if sys.platform.startswith("win") and os.path.exists(local_win):
        return local_win
    local_exe_dir = os.path.join(EXE_DIR, "ffmpeg.exe")
    if sys.platform.startswith("win") and os.path.exists(local_exe_dir):
        return local_exe_dir
    # 2. Sistema PATH (Linux o Windows)
    p = shutil.which("ffmpeg")
    if p:
        return p
    if os.path.exists(local_win):
        return local_win
    # 3. imageio_ffmpeg como fallback
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    return "ffmpeg"

def unpack_lulu_m3u8(embed_url):
    """Extrae la URL directa .m3u8 de una página embed de LuluStream."""
    headers = {"User-Agent": DEFAULT_USER_AGENT}
    try:
        req = urllib.request.Request(embed_url, headers=headers)
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[Kawaii Server] Error al cargar Lulu embed {embed_url}: {e}")
        return None

    # Intentar desempaquetar Dean Edwards packer
    m = re.search(
        r"eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)",
        html, re.DOTALL
    )
    if m:
        p, a, c, k = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).split("|")
        def e(c, a):
            return ("" if c < a else e(c // a, a)) + (
                chr(c % a + 29) if c % a > 35 else "0123456789abcdefghijklmnopqrstuvwxyz"[c % a]
            )
        for i in range(c - 1, -1, -1):
            if k[i]:
                p = re.sub(r"\b" + e(i, a) + r"\b", k[i], p)
        html = p

    # Buscar URL .m3u8
    m3u8 = re.search(r'["\']([^"\']+\.m3u8[^"\']*)["\']', html)
    if m3u8:
        return m3u8.group(1)
    return None

def resolve_and_fetch_embed(url, depth=0):
    """
    Sigue redirecciones HTTP y redirecciones JavaScript client-side
    (como jamespatterncamera -> shannoncoldalready -> susanexpectcare VOE)
    para evitar el error 'no existe el link'.
    """
    if depth > 5:
        return url, ""
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        final_url = resp.url
        html = resp.read().decode("utf-8", errors="ignore")

        # Comprobar redirección JS
        m = re.search(r'window\.location(?:\.href)?\s*=\s*[\'"]([^\'"]+)[\'"]', html)
        if m:
            target = m.group(1)
            if target.startswith("http"):
                return resolve_and_fetch_embed(target, depth + 1)

        return final_url, html
    except Exception as ex:
        print(f"[Kawaii Server] Error resolviendo {url}: {ex}")
        return url, f"<html><body style='background:#050508;color:#fff;font-family:sans-serif;padding:2rem;'><h3>Error al conectar con el servidor de video: {ex}</h3></body></html>"

STEALTH_ADBLOCK_SNIPPET = """
<script>
(function() {
  'use strict';
  console.log('[Kawaii Stealth] Protección invisible contra anuncios activada.');

  // 1. Defuse y engaño a detectores de AdBlock (justDetectAdblock, bait checkers, etc.)
  window.justDetectAdblock = {
    detectAnyAdblocker: function() { return Promise.resolve(false); },
    detectBait: function() { return Promise.resolve(false); }
  };
  window.__adbDetected = false;
  window.canRunAds = true;
  window.isAdBlockActive = false;
  window.adblock = false;
  window.adBlockDetected = false;
  window.hasAdBlock = false;
  window.isAdblock = false;
  window.FuckAdBlock = function() {
    this.on = function() { return this; };
    this.onDetected = function() { return this; };
    this.onNotDetected = function(fn) { if (typeof fn === 'function') setTimeout(fn, 1); return this; };
    this.check = function() { return false; };
  };
  window.fuckAdBlock = new window.FuckAdBlock();
  window.BlockAdBlock = window.FuckAdBlock;
  window.blockAdBlock = window.fuckAdBlock;

  // 2. Anular funciones de alertas de bloqueo del servidor (LuluStream, etc.)
  window.showADBOverlay = function() {};
  window.showGuardOverlay = function() {};
  window.checkADB = function() { return false; };

  // 3. Flags de bypass para VOE y reproductores similares
  window.sk = true;

  // 4. Absorber popups de anuncios silenciosamente
  // (evita que se abran nuevas pestañas molestas y que el servidor se dé cuenta)
  const fakeWin = {
    closed: false,
    focus: function() {},
    blur: function() {},
    close: function() { this.closed = true; },
    location: { href: '' },
    document: { write: function(){}, close: function(){} }
  };
  window.open = function(u, t, f) {
    console.log('[Kawaii Stealth] Popup interceptado silenciosamente:', u);
    return fakeWin;
  };

  // 5. Bloquear redirecciones no deseadas por clics en publicidad
  document.addEventListener('click', function(e) {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.href && !a.href.startsWith('javascript:')) {
      try {
        const u = new URL(a.href);
        if (u.hostname !== window.location.hostname && !u.hostname.includes('tmdb.org')) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[Kawaii Stealth] Enlace de anuncio detenido:', a.href);
        }
      } catch(err) {}
    }
  }, true);

  // 6. Eliminar bucles de anti-depuración 'debugger'
  const origSetInterval = window.setInterval;
  window.setInterval = function(fn, delay) {
    if (fn && typeof fn === 'function' && fn.toString().includes('debugger')) return -1;
    return origSetInterval.apply(this, arguments);
  };
})();
</script>
<style>
  /* Ocultar banners, capas de anuncio, overlays y ventanas emergentes sin romper el reproductor */
  .a85399, .b85399, #adbd, .overdiv, .jw-rightclick, .jw-logo-button,
  [class*="ad-overlay"], [id*="ad-overlay"], [id*="adblock"], [class*="adblock"],
  [id*="anti-adblock"], .adblock-banner, #adblock-msg, .adb-holder,
  div[style*="z-index: 999"], div[style*="z-index: 1000000"], div[style*="z-index: 2147483647"] {
    display: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
  }
</style>
"""

def build_stealth_player(final_url, html):
    """Inyecta el polyfill stealth y base tag para que el reproductor funcione sin anuncios ni bloqueos."""
    base_tag = f'<base href="{final_url}">\n'
    injected = base_tag + STEALTH_ADBLOCK_SNIPPET

    # Neutralizar showADBOverlay en el código empaquetado de Lulu
    html = html.replace('showADBOverlay()', '/* noop */')

    if "<head" in html.lower():
        html = re.sub(r'(<head[^>]*>)', r'\1' + injected, html, flags=re.IGNORECASE, count=1)
    else:
        html = injected + html
    return html

def rewrite_m3u8_playlist(content, base_url, referer):
    """Reescribe las URLs de una lista M3U8 para pasarlas por el proxy local con el Referer correcto."""
    lines = []
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            def repl_uri(m):
                u = m.group(1)
                full_u = urllib.parse.urljoin(base_url, u)
                return f'URI="/api/hls/segment?url={urllib.parse.quote_plus(full_u)}&ref={urllib.parse.quote_plus(referer)}"'
            line = re.sub(r'URI="([^"]+)"', repl_uri, line)
            lines.append(line)
        else:
            full_u = urllib.parse.urljoin(base_url, line)
            if ".m3u8" in line:
                lines.append(f"/api/hls/sub.m3u8?url={urllib.parse.quote_plus(full_u)}&ref={urllib.parse.quote_plus(referer)}")
            else:
                lines.append(f"/api/hls/segment?url={urllib.parse.quote_plus(full_u)}&ref={urllib.parse.quote_plus(referer)}")
    return "\n".join(lines)

def download_episode_job(key, stream_url, anime_title, ep_number, anime_id, poster=""):
    """Background thread: download episode in universal H.264 MP4."""
    ffmpeg = get_ffmpeg()
    safe_title = re.sub(r'[^\w\s-]', '', anime_title)[:40].strip().replace(" ", "_")
    filename = f"{safe_title}_Ep{ep_number:03d}.mp4"
    out_path = os.path.join(DOWNLOADS_DIR, filename)

    ACTIVE_DOWNLOADS[key] = {
        "status": "descargando",
        "progress": 0,
        "filename": filename,
        "animeTitle": anime_title,
        "episode": ep_number,
        "animeId": str(anime_id),
        "poster": poster
    }

    try:
        actual_url = stream_url

        if "luluvdoo.com" in stream_url or "lulustream.com" in stream_url:
            m3u8 = unpack_lulu_m3u8(stream_url)
            if m3u8:
                actual_url = m3u8

        parsed_ref = urllib.parse.urlparse(stream_url)
        stream_referer = f"{parsed_ref.scheme}://{parsed_ref.netloc}/" if parsed_ref.netloc else "https://luluvdoo.com/"

        print(f"\n[Kawaii DL] Descargando: {anime_title} Ep.{ep_number}")
        print(f"[Kawaii DL] Fuente: {actual_url[:80]}...")
        print(f"[Kawaii DL] Guardando en: {out_path}")

        # 1. Intentar copia directa de stream (-c copy) para máxima velocidad y codec H.264 nativo
        cmd_copy = [
            ffmpeg,
            "-y",
            "-referer", stream_referer,
            "-user_agent", DEFAULT_USER_AGENT,
            "-i", actual_url,
            "-c", "copy",
            "-bsf:a", "aac_adtstoasc",
            "-movflags", "+faststart",
            out_path
        ]

        proc = subprocess.Popen(
            cmd_copy, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL,
            universal_newlines=True
        )

        duration_secs = None
        time_re = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")
        dur_re  = re.compile(r"Duration: (\d+):(\d+):(\d+\.\d+)")

        for line in proc.stderr:
            dm = dur_re.search(line)
            if dm and not duration_secs:
                h, m, s = dm.groups()
                duration_secs = int(h)*3600 + int(m)*60 + float(s)

            tm = time_re.search(line)
            if tm and duration_secs:
                h, m, s = tm.groups()
                current = int(h)*3600 + int(m)*60 + float(s)
                pct = min(99, int(current / duration_secs * 100))
                ACTIVE_DOWNLOADS[key]["progress"] = pct

        proc.wait()

        # 2. Si copy falla, realizar transcodificación estándar H.264 universal
        if proc.returncode != 0:
            print("[Kawaii DL] Stream copy no disponible, transcodificando a H.264 estándar (yuv420p)...")
            cmd_transcode = [
                ffmpeg,
                "-y",
                "-referer", stream_referer,
                "-user_agent", DEFAULT_USER_AGENT,
                "-i", actual_url,
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "veryfast",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                out_path
            ]
            proc = subprocess.Popen(
                cmd_transcode, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL,
                universal_newlines=True
            )
            for line in proc.stderr:
                dm = dur_re.search(line)
                if dm and not duration_secs:
                    h, m, s = dm.groups()
                    duration_secs = int(h)*3600 + int(m)*60 + float(s)

                tm = time_re.search(line)
                if tm and duration_secs:
                    h, m, s = tm.groups()
                    current = int(h)*3600 + int(m)*60 + float(s)
                    pct = min(99, int(current / duration_secs * 100))
                    ACTIVE_DOWNLOADS[key]["progress"] = pct
            proc.wait()

            if proc.returncode != 0:
                raise RuntimeError(f"ffmpeg falló con código de salida {proc.returncode}")

        size_mb = os.path.getsize(out_path) / 1_048_576

        entries = load_index()
        entry = {
            "key": key,
            "animeId": str(anime_id),
            "animeTitle": anime_title,
            "episode": ep_number,
            "filename": filename,
            "sizeMB": round(size_mb, 1),
            "poster": poster,
            "downloaded": True
        }
        entries = [e for e in entries if e.get("key") != key]
        entries.insert(0, entry)
        save_index(entries)

        ACTIVE_DOWNLOADS[key] = {
            "status": "completo",
            "progress": 100,
            "filename": filename,
            "sizeMB": round(size_mb, 1),
            "animeTitle": anime_title,
            "episode": ep_number,
            "animeId": str(anime_id),
            "poster": poster
        }
        print(f"[Kawaii DL] ✅ Listo! {filename} ({round(size_mb, 1)} MB - H.264 compatible)")

    except Exception as ex:
        ACTIVE_DOWNLOADS[key] = {"status": "error", "progress": 0, "error": str(ex)}
        print(f"[Kawaii DL] ❌ Error: {ex}")


class KawaiiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def log_message(self, format, *args):
        pass  # silenciar logs de peticiones estáticas

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.send_header("Cache-Control", "no-cache")
        if self.path.rstrip("/").endswith("sw.js"):
            self.send_header("Service-Worker-Allowed", "/")
            self.send_header("Content-Type", "application/javascript")
        super().end_headers()

    def send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_file_with_range(self, filepath, content_type="video/mp4"):
        try:
            file_size = os.path.getsize(filepath)
            range_header = self.headers.get("Range")

            if not range_header:
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(file_size))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(filepath, "rb") as f:
                    shutil.copyfileobj(f, self.wfile)
                return

            m = re.match(r"bytes=(\d+)-(\d*)", range_header)
            if not m:
                self.send_response(416)
                self.end_headers()
                return

            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else file_size - 1
            if start >= file_size or end >= file_size or start > end:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return

            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()

            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = length
                chunk_size = 128 * 1024
                while remaining > 0:
                    read_bytes = min(chunk_size, remaining)
                    data = f.read(read_bytes)
                    if not data:
                        break
                    self.wfile.write(data)
                    remaining -= len(data)
        except Exception:
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ── API: Información de Stream (Decide si es HLS directo o Proxy Stealth) ────
        if path == "/api/stream-info":
            url = params.get("url", [""])[0]
            if not url:
                self.send_json({"error": "URL requerida"}, 400)
                return

            if ".m3u8" in url:
                manifest_url = f"/api/hls/master.m3u8?url={urllib.parse.quote_plus(url)}&ref={urllib.parse.quote_plus(url)}"
                self.send_json({"status": "ok", "mode": "hls", "url": manifest_url})
                return

            # Extraer HLS directo nativo (LuluStream, Streamwish, etc.) para 0 anuncios y 0 bloqueos
            m3u8 = unpack_lulu_m3u8(url)
            if m3u8:
                parsed_host = urllib.parse.urlparse(url).netloc
                manifest_url = f"/api/hls/master.m3u8?url={urllib.parse.quote_plus(m3u8)}&ref={urllib.parse.quote_plus(f'https://{parsed_host}/')}"
                self.send_json({"status": "ok", "mode": "hls", "url": manifest_url})
                return

            # Para otros servidores: Reproductor Embed con AdBlock Stealth
            player_url = f"/api/player?url={urllib.parse.quote_plus(url)}"
            self.send_json({"status": "ok", "mode": "embed", "player": player_url})
            return

        # ── API: Proxy de M3U8 Master ────────────────────────────────
        if path == "/api/hls/master.m3u8":
            target_url = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                return

            try:
                req = urllib.request.Request(target_url, headers={
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Referer": referer
                })
                resp = urllib.request.urlopen(req, timeout=15)
                content = resp.read().decode("utf-8", errors="ignore")
                rewritten = rewrite_m3u8_playlist(content, target_url, referer).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                self.send_header("Content-Length", str(len(rewritten)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(rewritten)
            except Exception as e:
                print(f"[Kawaii HLS Master Error]: {e}")
                self.send_response(500)
                self.end_headers()
            return

        # ── API: Proxy de M3U8 Sub-playlist ──────────────────────────
        if path == "/api/hls/sub.m3u8":
            target_url = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                return

            try:
                req = urllib.request.Request(target_url, headers={
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Referer": referer
                })
                resp = urllib.request.urlopen(req, timeout=15)
                content = resp.read().decode("utf-8", errors="ignore")
                rewritten = rewrite_m3u8_playlist(content, target_url, referer).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                self.send_header("Content-Length", str(len(rewritten)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(rewritten)
            except Exception as e:
                print(f"[Kawaii HLS Sub Error]: {e}")
                self.send_response(500)
                self.end_headers()
            return

        # ── API: Proxy de Segmentos .TS y Claves de Encriptación ───────
        if path == "/api/hls/segment":
            target_url = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                return

            try:
                req = urllib.request.Request(target_url, headers={
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Referer": referer
                })
                resp = urllib.request.urlopen(req, timeout=20)
                data = resp.read()

                content_type = "video/mp2t" if ".ts" in target_url else "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            return

        # ── API: Reproductor Embed con AdBlock Stealth Invisible ─────
        if path == "/api/player":
            target_url = params.get("url", [""])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                return

            final_url, raw_html = resolve_and_fetch_embed(target_url)
            stealth_html = build_stealth_player(final_url, raw_html).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(stealth_html)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(stealth_html)
            return

        # ── API: list downloads ──────────────────────────────────────
        if path == "/api/downloads":
            entries = load_index()
            keys_in_index = {e["key"] for e in entries}
            for key, info in ACTIVE_DOWNLOADS.items():
                if info["status"] != "completo" and key not in keys_in_index:
                    parts = key.split("_ep_")
                    entries.insert(0, {
                        "key": key,
                        "animeTitle": parts[0].replace("_", " ") if parts else key,
                        "episode": int(parts[1]) if len(parts) > 1 else 0,
                        "downloading": True,
                        **info
                    })
            self.send_json(entries)
            return

        # ── API: start download ──────────────────────────────────────
        if path == "/api/descargar":
            url        = params.get("url", [""])[0]
            title      = urllib.parse.unquote_plus(params.get("title", ["Anime"])[0])
            ep         = int(params.get("ep", ["1"])[0])
            anime_id   = params.get("animeId", ["0"])[0]
            poster     = urllib.parse.unquote_plus(params.get("poster", [""])[0])
            safe_title = re.sub(r'[^\w]', '_', title)[:30]
            key        = f"{safe_title}_ep_{ep}"

            if not url:
                self.send_json({"error": "URL requerida"}, 400)
                return

            existing = ACTIVE_DOWNLOADS.get(key, {})
            if existing.get("status") in ("descargando",):
                self.send_json({"status": "ya_descargando", "key": key})
                return

            entries = load_index()
            already = next((e for e in entries if e.get("key") == key), None)
            if already and os.path.exists(os.path.join(DOWNLOADS_DIR, already["filename"])):
                self.send_json({"status": "ya_descargado", "key": key, "filename": already["filename"]})
                return

            t = threading.Thread(
                target=download_episode_job,
                args=(key, url, title, ep, anime_id, poster),
                daemon=True
            )
            t.start()
            self.send_json({"status": "iniciando", "key": key})
            return

        # ── API: check download progress ─────────────────────────────
        if path == "/api/progreso":
            key = params.get("key", [""])[0]
            info = ACTIVE_DOWNLOADS.get(key)
            if info:
                self.send_json(info)
            else:
                self.send_json({"status": "no_encontrado"})
            return

        # ── API: delete download ─────────────────────────────────────
        if path == "/api/borrar":
            key = params.get("key", [""])[0]
            entries = load_index()
            entry = next((e for e in entries if e.get("key") == key), None)
            if entry:
                fp = os.path.join(DOWNLOADS_DIR, entry["filename"])
                if os.path.exists(fp):
                    os.remove(fp)
                entries = [e for e in entries if e.get("key") != key]
                save_index(entries)
                ACTIVE_DOWNLOADS.pop(key, None)
                self.send_json({"status": "borrado"})
            else:
                self.send_json({"status": "no_encontrado"}, 404)
            return

        # ── Video descargado local con soporte Range (HTML5 Video & Seeking) ──
        if path.startswith("/descargas/"):
            filename = urllib.parse.unquote(path[len("/descargas/"):])
            filepath = os.path.join(DOWNLOADS_DIR, filename)
            if not os.path.exists(filepath) or not os.path.isfile(filepath):
                self.send_response(404)
                self.end_headers()
                return

            self.serve_file_with_range(filepath, "video/mp4")
            return

        # ── Archivos estáticos ───────────────────────────────────────
        super().do_GET()


if __name__ == "__main__":
    local_ip = get_local_ip()
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), KawaiiHandler) as httpd:
        print("=" * 65)
        print("   🌸 KAWAII ANIMES — SERVIDOR CON DESCARGAS Y AD-SHIELD 🌸")
        print("=" * 65)
        print(f"\n  💻 Acceso local:        http://localhost:{PORT}")
        print(f"  📱 Acceso desde móvil:  http://{local_ip}:{PORT}")
        print(f"  💾 Descargas guardadas en: site/descargas/")
        print("\n  Presiona Ctrl+C para detener.")
        print("=" * 65 + "\n")
        try:
            webbrowser.open(f"http://localhost:{PORT}")
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
            sys.exit(0)
