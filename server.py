#!/usr/bin/env python3
"""
KAWAII ANIMES — Servidor de streaming con proxy stealth anti-anuncios.
Replica exactamente la fórmula de headers y lógica del binario cifrado (.app / composeApp-desktop.jar).

Fórmula de la app cifrada (StreamingRequestPolicy.kt decompilado):
  - User-Agent: Windows Desktop Chrome 120 (NO Linux)
  - Accept-Language: es-419,es;q=0.9,en;q=0.8
  - Sec-Fetch-* headers completos (como navegador real)
  - Referer + Origin derivados de la URL del stream
  - Embed headers: Sec-Fetch-Site=cross-site, Mode=navigate, Dest=document
  - HLS/segment headers: Sec-Fetch-Site=same-origin, Mode=cors, Dest=empty
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

# ──────────────────────────────────────────────────────────────────────────────
# Rutas (compatible con PyInstaller)
# ──────────────────────────────────────────────────────────────────────────────
PORT = 3000
if getattr(sys, "frozen", False):
    BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    EXE_DIR    = os.path.dirname(sys.executable)
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR    = BUNDLE_DIR

SITE_DIR        = os.path.join(BUNDLE_DIR, "site")
DOWNLOADS_DIR   = os.path.join(EXE_DIR, "descargas")
DOWNLOADS_INDEX = os.path.join(DOWNLOADS_DIR, "index.json")
ACTIVE_DOWNLOADS = {}

os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────────
# Perfiles de User-Agent  (igual que StreamingClientProfile en el .app)
# ──────────────────────────────────────────────────────────────────────────────
UA_DESKTOP = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
UA_MOBILE = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML like Gecko) "
    "Version/16.6 Mobile/15E148 Safari/604.1"
)
ACCEPT_LANGUAGE = "es-419,es;q=0.9,en;q=0.8"

# ──────────────────────────────────────────────────────────────────────────────
# Generadores de headers  (replica StreamingRequestPolicy.kt)
# ──────────────────────────────────────────────────────────────────────────────

def _origin_from_url(url: str) -> str:
    """Extrae 'scheme://host' de una URL."""
    p = urllib.parse.urlparse(url)
    if p.scheme and p.netloc:
        return f"{p.scheme}://{p.netloc}"
    return ""

def embed_headers(referer_url: str | None = None, with_sec_fetch: bool = True) -> dict:
    """
    Headers para cargar la página embed del reproductor.
    Replica embedHeaders() de StreamingRequestPolicy.kt.
    """
    h = {
        "User-Agent": UA_DESKTOP,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": ACCEPT_LANGUAGE,
        "Upgrade-Insecure-Requests": "1",
    }
    if with_sec_fetch:
        h["Sec-Fetch-Site"] = "cross-site" if referer_url else "none"
        h["Sec-Fetch-Mode"] = "navigate"
        h["Sec-Fetch-Dest"] = "document"
        h["Sec-Fetch-User"] = "?1"
    if referer_url:
        h["Referer"] = referer_url
    return h


def hls_headers(stream_url: str, referer_url: str) -> dict:
    """
    Headers para peticiones de segmentos/playlists HLS.
    Replica playbackResourceHeaders() de StreamingRequestPolicy.kt.
    """
    origin = _origin_from_url(referer_url) or _origin_from_url(stream_url)
    return {
        "User-Agent": UA_DESKTOP,
        "Accept": "*/*",
        "Accept-Language": ACCEPT_LANGUAGE,
        "Referer": referer_url,
        "Origin": origin,
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
    }


def api_headers(referer_url: str, origin_url: str, accept: str = "*/*") -> dict:
    """
    Headers para peticiones de API (AniList, etc.).
    Replica apiHeaders() de StreamingRequestPolicy.kt.
    """
    return {
        "User-Agent": UA_MOBILE,
        "Accept": accept,
        "Accept-Language": ACCEPT_LANGUAGE,
        "Referer": referer_url,
        "Origin": origin_url,
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
    }

# ──────────────────────────────────────────────────────────────────────────────
# Snippet stealth anti-anuncios (inyectado en el HTML del embed)
# ──────────────────────────────────────────────────────────────────────────────
STEALTH_SNIPPET = """
<script>
(function() {
  'use strict';
  // 1. Neutralizar detectores de AdBlock
  window.justDetectAdblock = {
    detectAnyAdblocker: () => Promise.resolve(false),
    detectBait: () => Promise.resolve(false)
  };
  window.__adbDetected = false;
  window.canRunAds = true;
  window.isAdBlockActive = false;
  window.adblock = false;
  window.adBlockDetected = false;
  window.hasAdBlock = false;
  window.isAdblock = false;
  window.FuckAdBlock = function(){
    this.on = () => this;
    this.onDetected = () => this;
    this.onNotDetected = fn => { if(typeof fn==='function') setTimeout(fn,1); return this; };
    this.check = () => false;
  };
  window.fuckAdBlock = new window.FuckAdBlock();
  window.BlockAdBlock = window.FuckAdBlock;
  window.blockAdBlock = window.fuckAdBlock;

  // 2. Silenciar overlays de servidores (Lulu, Streamwish, VOE…)
  window.showADBOverlay  = () => {};
  window.showGuardOverlay = () => {};
  window.checkADB = () => false;
  window.sk = true;   // flag bypass VOE

  // 3. Interceptar popups de anuncios
  const _fakeWin = {
    closed: false, name: '',
    focus(){}, blur(){},
    close(){ this.closed = true; },
    location: { href: '', replace(){} },
    document: { write(){}, close(){} }
  };
  window.open = (u) => {
    console.log('[Kawaii Stealth] Popup bloqueado:', u);
    return _fakeWin;
  };

  // 4. Bloquear clicks en enlaces externos (anuncios)
  document.addEventListener('click', e => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.href && !a.href.startsWith('javascript:')) {
      try {
        const u = new URL(a.href);
        if (u.hostname !== window.location.hostname && !u.hostname.includes('tmdb.org')) {
          e.preventDefault(); e.stopPropagation();
        }
      } catch(_) {}
    }
  }, true);

  // 5. Eliminar loops debugger
  const _origSI = window.setInterval;
  window.setInterval = (fn, d) => {
    if (fn && typeof fn === 'function' && fn.toString().includes('debugger')) return -1;
    return _origSI.apply(this, arguments);
  };
})();
</script>
<style>
/* Ocultar banners/overlays sin romper el reproductor */
.a85399,.b85399,#adbd,.overdiv,.jw-rightclick,.jw-logo-button,
[class*="ad-overlay"],[id*="ad-overlay"],[id*="adblock"],[class*="adblock"],
[id*="anti-adblock"],.adblock-banner,#adblock-msg,.adb-holder,
div[style*="z-index: 999"],
div[style*="z-index: 1000000"],
div[style*="z-index: 2147483647"] {
  display:none!important;
  opacity:0!important;
  pointer-events:none!important;
  visibility:hidden!important;
}
</style>
"""


def inject_stealth(final_url: str, html: str) -> str:
    """Inyecta base tag + snippet stealth en el <head> del HTML del embed."""
    injected = f'<base href="{final_url}">' + STEALTH_SNIPPET
    # Neutralizar showADBOverlay en código empaquetado
    html = html.replace('showADBOverlay()', '/* noop */')
    if re.search(r'<head', html, re.IGNORECASE):
        html = re.sub(r'(<head[^>]*>)', r'\1' + injected, html, flags=re.IGNORECASE, count=1)
    else:
        html = injected + html
    return html

# ──────────────────────────────────────────────────────────────────────────────
# Extracción HLS de LuluStream (Dean Edwards packer)
# ──────────────────────────────────────────────────────────────────────────────
def _unpack_p_a_c_k_e_d(html: str) -> str | None:
    """Desempaqueta el obfuscador Dean Edwards eval(function(p,a,c,k,e,d))."""
    m = re.search(
        r"eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)",
        html, re.DOTALL
    )
    if not m:
        return None
    p, a, c, k = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).split("|")
    def enc(val, base):
        return ("" if val < base else enc(val // base, base)) + (
            chr(val % base + 29) if val % base > 35
            else "0123456789abcdefghijklmnopqrstuvwxyz"[val % base]
        )
    for i in range(c - 1, -1, -1):
        if k[i]:
            p = re.sub(r"\b" + enc(i, a) + r"\b", k[i], p)
    return p


def extract_m3u8_from_embed(embed_url: str) -> str | None:
    """
    Obtiene la URL directa .m3u8 de un embed de LuluStream/Streamwish/VOE.
    Usa los mismos headers que el .app (embed_headers con Sec-Fetch-*).
    """
    referer = _origin_from_url(embed_url) + "/"
    headers = embed_headers(referer_url=referer, with_sec_fetch=True)
    try:
        req  = urllib.request.Request(embed_url, headers=headers)
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[Kawaii] extract_m3u8: error cargando {embed_url}: {e}")
        return None

    # Desempaquetar si está obfuscado
    unpacked = _unpack_p_a_c_k_e_d(html)
    source   = unpacked if unpacked else html

    # Buscar .m3u8
    m = re.search(r'["\']([^"\']+\.m3u8[^"\']*)["\']', source)
    if m:
        return m.group(1)
    # Buscar directamente en el HTML sin comillas
    m2 = re.search(r'https?://[^\s"\'<>]+\.m3u8[^\s"\'<>]*', source)
    if m2:
        return m2.group(0)
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Resolución de redirecciones del embed (HTTP + JS location)
# ──────────────────────────────────────────────────────────────────────────────
def resolve_embed(url: str, depth: int = 0) -> tuple[str, str]:
    """Sigue redirecciones HTTP y JS para obtener el HTML final del embed."""
    if depth > 5:
        return url, ""
    headers = embed_headers(referer_url=_origin_from_url(url) + "/", with_sec_fetch=True)
    try:
        req  = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        final_url = resp.url
        html = resp.read().decode("utf-8", errors="ignore")
        # Seguir redirección JS
        m = re.search(r'window\.location(?:\.href)?\s*=\s*[\'"]([^\'"]+)[\'"]', html)
        if m and m.group(1).startswith("http"):
            return resolve_embed(m.group(1), depth + 1)
        return final_url, html
    except Exception as ex:
        print(f"[Kawaii] resolve_embed error {url}: {ex}")
        err_html = (
            f"<html><body style='background:#050508;color:#fff;font-family:sans-serif;"
            f"padding:2rem;'><h3>Error al conectar con el servidor de video: {ex}</h3></body></html>"
        )
        return url, err_html


# ──────────────────────────────────────────────────────────────────────────────
# Reescritura de playlists HLS (proxy local)
# ──────────────────────────────────────────────────────────────────────────────
def rewrite_m3u8(content: str, base_url: str, referer: str) -> str:
    lines = []
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('#'):
            def _repl(m):
                u = m.group(1)
                full = urllib.parse.urljoin(base_url, u)
                return (f'URI="/api/hls/segment?url={urllib.parse.quote_plus(full)}'
                        f'&ref={urllib.parse.quote_plus(referer)}"')
            line = re.sub(r'URI="([^"]+)"', _repl, line)
            lines.append(line)
        else:
            full = urllib.parse.urljoin(base_url, line)
            if ".m3u8" in line:
                lines.append(
                    f"/api/hls/sub.m3u8?url={urllib.parse.quote_plus(full)}"
                    f"&ref={urllib.parse.quote_plus(referer)}"
                )
            else:
                lines.append(
                    f"/api/hls/segment?url={urllib.parse.quote_plus(full)}"
                    f"&ref={urllib.parse.quote_plus(referer)}"
                )
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
# Utilidades generales
# ──────────────────────────────────────────────────────────────────────────────
def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def load_index() -> list:
    if os.path.exists(DOWNLOADS_INDEX):
        try:
            with open(DOWNLOADS_INDEX, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_index(entries: list):
    with open(DOWNLOADS_INDEX, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


def get_ffmpeg() -> str:
    local_win = os.path.join(BUNDLE_DIR, "app", "resources", "ffmpeg.exe")
    if sys.platform.startswith("win") and os.path.exists(local_win):
        return local_win
    local_exe = os.path.join(EXE_DIR, "ffmpeg.exe")
    if sys.platform.startswith("win") and os.path.exists(local_exe):
        return local_exe
    p = shutil.which("ffmpeg")
    if p:
        return p
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    return "ffmpeg"


# ──────────────────────────────────────────────────────────────────────────────
# Descarga de episodios (ffmpeg)
# ──────────────────────────────────────────────────────────────────────────────
def download_episode_job(key, stream_url, anime_title, ep_number, anime_id, poster=""):
    ffmpeg    = get_ffmpeg()
    safe      = re.sub(r'[^\w\s-]', '', anime_title)[:40].strip().replace(" ", "_")
    filename  = f"{safe}_Ep{ep_number:03d}.mp4"
    out_path  = os.path.join(DOWNLOADS_DIR, filename)

    ACTIVE_DOWNLOADS[key] = {
        "status": "descargando", "progress": 0, "filename": filename,
        "animeTitle": anime_title, "episode": ep_number,
        "animeId": str(anime_id), "poster": poster
    }
    try:
        actual_url = stream_url
        if "luluvdoo.com" in stream_url or "lulustream.com" in stream_url:
            m3u8 = extract_m3u8_from_embed(stream_url)
            if m3u8:
                actual_url = m3u8

        ref_parsed    = urllib.parse.urlparse(stream_url)
        stream_referer = (f"{ref_parsed.scheme}://{ref_parsed.netloc}/"
                          if ref_parsed.netloc else "https://luluvdoo.com/")

        print(f"\n[Kawaii DL] Descargando: {anime_title} Ep.{ep_number}")
        print(f"[Kawaii DL] Fuente: {actual_url[:80]}...")

        time_re = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")
        dur_re  = re.compile(r"Duration: (\d+):(\d+):(\d+\.\d+)")

        def _run_ffmpeg(cmd):
            proc = subprocess.Popen(
                cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL,
                universal_newlines=True
            )
            duration_secs = None
            for line in proc.stderr:
                dm = dur_re.search(line)
                if dm and not duration_secs:
                    h, m, s = dm.groups()
                    duration_secs = int(h)*3600 + int(m)*60 + float(s)
                tm = time_re.search(line)
                if tm and duration_secs:
                    h, m, s = tm.groups()
                    cur = int(h)*3600 + int(m)*60 + float(s)
                    ACTIVE_DOWNLOADS[key]["progress"] = min(99, int(cur / duration_secs * 100))
            proc.wait()
            return proc.returncode

        base_args = [ffmpeg, "-y", "-referer", stream_referer,
                     "-user_agent", UA_DESKTOP, "-i", actual_url]

        rc = _run_ffmpeg(base_args + ["-c", "copy", "-bsf:a", "aac_adtstoasc",
                                       "-movflags", "+faststart", out_path])
        if rc != 0:
            print("[Kawaii DL] Stream copy falló, transcodificando a H.264...")
            rc = _run_ffmpeg(base_args + ["-c:v", "libx264", "-pix_fmt", "yuv420p",
                                           "-preset", "veryfast", "-crf", "23",
                                           "-c:a", "aac", "-b:a", "128k",
                                           "-movflags", "+faststart", out_path])
            if rc != 0:
                raise RuntimeError(f"ffmpeg falló con código {rc}")

        size_mb = os.path.getsize(out_path) / 1_048_576
        entry   = {
            "key": key, "animeId": str(anime_id), "animeTitle": anime_title,
            "episode": ep_number, "filename": filename,
            "sizeMB": round(size_mb, 1), "poster": poster, "downloaded": True
        }
        entries = [e for e in load_index() if e.get("key") != key]
        entries.insert(0, entry)
        save_index(entries)
        ACTIVE_DOWNLOADS[key] = {
            "status": "completo", "progress": 100, "filename": filename,
            "sizeMB": round(size_mb, 1), "animeTitle": anime_title,
            "episode": ep_number, "animeId": str(anime_id), "poster": poster
        }
        print(f"[Kawaii DL] ✅ {filename} ({round(size_mb,1)} MB)")
    except Exception as ex:
        ACTIVE_DOWNLOADS[key] = {"status": "error", "progress": 0, "error": str(ex)}
        print(f"[Kawaii DL] ❌ Error: {ex}")


# ──────────────────────────────────────────────────────────────────────────────
# HTTP Handler
# ──────────────────────────────────────────────────────────────────────────────
class KawaiiHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SITE_DIR, **kwargs)

    def log_message(self, fmt, *args):
        pass  # silenciar logs de archivos estáticos

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin",  "*")
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

    def serve_range(self, filepath, content_type="video/mp4"):
        """Sirve un archivo local con soporte de rango (Range request)."""
        try:
            size   = os.path.getsize(filepath)
            rh     = self.headers.get("Range")
            if not rh:
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(size))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(filepath, "rb") as f:
                    shutil.copyfileobj(f, self.wfile)
                return
            m = re.match(r"bytes=(\d+)-(\d*)", rh)
            if not m:
                self.send_response(416); self.end_headers(); return
            start = int(m.group(1))
            end   = int(m.group(2)) if m.group(2) else size - 1
            if start >= size or end >= size or start > end:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.end_headers(); return
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(131072, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
        except Exception:
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        # ── /api/stream-info  ────────────────────────────────────────────────
        if path == "/api/stream-info":
            url = params.get("url", [""])[0]
            if not url:
                self.send_json({"error": "URL requerida"}, 400); return

            # Si ya es m3u8 directo
            if ".m3u8" in url:
                murl = (f"/api/hls/master.m3u8"
                        f"?url={urllib.parse.quote_plus(url)}"
                        f"&ref={urllib.parse.quote_plus(url)}")
                self.send_json({"status": "ok", "mode": "hls", "url": murl}); return

            # Intentar extraer m3u8 del embed (cero anuncios)
            m3u8 = extract_m3u8_from_embed(url)
            if m3u8:
                ref = _origin_from_url(url) + "/"
                murl = (f"/api/hls/master.m3u8"
                        f"?url={urllib.parse.quote_plus(m3u8)}"
                        f"&ref={urllib.parse.quote_plus(ref)}")
                self.send_json({"status": "ok", "mode": "hls", "url": murl}); return

            # Fallback: embed con stealth
            purl = f"/api/player?url={urllib.parse.quote_plus(url)}"
            self.send_json({"status": "ok", "mode": "embed", "player": purl}); return

        # ── /api/hls/master.m3u8  ────────────────────────────────────────────
        if path == "/api/hls/master.m3u8":
            target  = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target:
                self.send_response(400); self.end_headers(); return
            try:
                hdrs = hls_headers(target, referer)
                req  = urllib.request.Request(target, headers=hdrs)
                resp = urllib.request.urlopen(req, timeout=15)
                content   = resp.read().decode("utf-8", errors="ignore")
                rewritten = rewrite_m3u8(content, target, referer).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                self.send_header("Content-Length", str(len(rewritten)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(rewritten)
            except Exception as e:
                print(f"[Kawaii HLS Master] Error: {e}")
                self.send_response(500); self.end_headers()
            return

        # ── /api/hls/sub.m3u8  ───────────────────────────────────────────────
        if path == "/api/hls/sub.m3u8":
            target  = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target:
                self.send_response(400); self.end_headers(); return
            try:
                hdrs = hls_headers(target, referer)
                req  = urllib.request.Request(target, headers=hdrs)
                resp = urllib.request.urlopen(req, timeout=15)
                content   = resp.read().decode("utf-8", errors="ignore")
                rewritten = rewrite_m3u8(content, target, referer).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.apple.mpegurl")
                self.send_header("Content-Length", str(len(rewritten)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(rewritten)
            except Exception as e:
                print(f"[Kawaii HLS Sub] Error: {e}")
                self.send_response(500); self.end_headers()
            return

        # ── /api/hls/segment  ────────────────────────────────────────────────
        if path == "/api/hls/segment":
            target  = params.get("url", [""])[0]
            referer = params.get("ref", ["https://luluvdoo.com/"])[0]
            if not target:
                self.send_response(400); self.end_headers(); return
            try:
                hdrs = hls_headers(target, referer)
                req  = urllib.request.Request(target, headers=hdrs)
                resp = urllib.request.urlopen(req, timeout=20)
                data = resp.read()
                ct   = "video/mp2t" if ".ts" in target else "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", ct)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
            except Exception:
                self.send_response(500); self.end_headers()
            return

        # ── /api/player  (embed con stealth) ─────────────────────────────────
        if path == "/api/player":
            target = params.get("url", [""])[0]
            if not target:
                self.send_response(400); self.end_headers(); return
            final_url, raw_html = resolve_embed(target)
            html_bytes = inject_stealth(final_url, raw_html).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(html_bytes)
            return

        # ── /api/downloads  ───────────────────────────────────────────────────
        if path == "/api/downloads":
            entries      = load_index()
            keys_indexed = {e["key"] for e in entries}
            for key, info in ACTIVE_DOWNLOADS.items():
                if info["status"] != "completo" and key not in keys_indexed:
                    parts = key.split("_ep_")
                    entries.insert(0, {
                        "key": key,
                        "animeTitle": parts[0].replace("_", " ") if parts else key,
                        "episode": int(parts[1]) if len(parts) > 1 else 0,
                        "downloading": True,
                        **info
                    })
            self.send_json(entries); return

        # ── /api/descargar  ───────────────────────────────────────────────────
        if path == "/api/descargar":
            url      = params.get("url",   [""])[0]
            title    = urllib.parse.unquote_plus(params.get("title",   ["Anime"])[0])
            ep       = int(params.get("ep",      ["1"])[0])
            anime_id = params.get("animeId", ["0"])[0]
            poster   = urllib.parse.unquote_plus(params.get("poster",  [""])[0])
            safe     = re.sub(r'[^\w]', '_', title)[:30]
            key      = f"{safe}_ep_{ep}"
            if not url:
                self.send_json({"error": "URL requerida"}, 400); return
            if ACTIVE_DOWNLOADS.get(key, {}).get("status") == "descargando":
                self.send_json({"status": "ya_descargando", "key": key}); return
            entries = load_index()
            already = next((e for e in entries if e.get("key") == key), None)
            if already and os.path.exists(os.path.join(DOWNLOADS_DIR, already["filename"])):
                self.send_json({"status": "ya_descargado", "key": key,
                                "filename": already["filename"]}); return
            threading.Thread(
                target=download_episode_job,
                args=(key, url, title, ep, anime_id, poster),
                daemon=True
            ).start()
            self.send_json({"status": "iniciando", "key": key}); return

        # ── /api/progreso  ────────────────────────────────────────────────────
        if path == "/api/progreso":
            key  = params.get("key", [""])[0]
            info = ACTIVE_DOWNLOADS.get(key)
            self.send_json(info if info else {"status": "no_encontrado"}); return

        # ── /api/borrar  ──────────────────────────────────────────────────────
        if path == "/api/borrar":
            key     = params.get("key", [""])[0]
            entries = load_index()
            entry   = next((e for e in entries if e.get("key") == key), None)
            if entry:
                fp = os.path.join(DOWNLOADS_DIR, entry["filename"])
                if os.path.exists(fp):
                    os.remove(fp)
                save_index([e for e in entries if e.get("key") != key])
                ACTIVE_DOWNLOADS.pop(key, None)
                self.send_json({"status": "borrado"})
            else:
                self.send_json({"status": "no_encontrado"}, 404)
            return

        # ── /descargas/*  (rango) ─────────────────────────────────────────────
        if path.startswith("/descargas/"):
            fname = urllib.parse.unquote(path[len("/descargas/"):])
            fpath = os.path.join(DOWNLOADS_DIR, fname)
            if not os.path.isfile(fpath):
                self.send_response(404); self.end_headers(); return
            self.serve_range(fpath, "video/mp4"); return

        # ── Archivos estáticos ────────────────────────────────────────────────
        super().do_GET()


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    local_ip = get_local_ip()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), KawaiiHandler) as httpd:
        print("=" * 65)
        print("   🌸 KAWAII ANIMES — SERVIDOR CON DESCARGAS Y AD‑SHIELD 🌸")
        print("   (Fórmula replicada del binario cifrado — StreamingRequestPolicy)")
        print("=" * 65)
        print(f"\n  💻 Acceso local:        http://localhost:{PORT}")
        print(f"  📱 Acceso desde móvil:  http://{local_ip}:{PORT}")
        print("  💾 Descargas:           site/descargas/")
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
