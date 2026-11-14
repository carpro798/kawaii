# Runtime multimedia de Kawaii Animes

Cada instalador Desktop incluye su propia copia de **mpv/libmpv**, **FFmpeg** y
las bibliotecas transitivas necesarias. La aplicación no utiliza instalaciones
del sistema ni busca estas herramientas en `PATH`.

Los archivos `RUNTIME-VERSIONS.txt` y `SHA256SUMS.txt` del payload identifican
exactamente lo que se empaquetó. La carpeta `licenses/` contiene los textos de
licencia entregados por las distribuciones fuente de mpv y FFmpeg.

Proyectos principales:

- mpv: <https://github.com/mpv-player/mpv> — GPL-2.0-or-later de forma
  predeterminada; LGPL-2.1-or-later solo para builds creados expresamente con
  `-Dgpl=false` y dependencias compatibles.
- FFmpeg: <https://ffmpeg.org/> — LGPL-2.1-or-later de forma predeterminada; un
  build que habilite componentes GPL se distribuye bajo GPL.
- OpenSSL: <https://www.openssl.org/> — Apache-2.0.
- libass: <https://github.com/libass/libass> — ISC.
- dav1d: <https://code.videolan.org/videolan/dav1d> — BSD-2-Clause.
- libplacebo: <https://code.videolan.org/videolan/libplacebo> — LGPL-2.1-or-later.
- FreeType: <https://freetype.org/> — FreeType License o GPL-2.0-only.
- HarfBuzz: <https://github.com/harfbuzz/harfbuzz> — MIT.
- LuaJIT: <https://luajit.org/> — MIT.
- zlib, xz, zstd, lz4, libpng, libjpeg-turbo, libarchive y demás dependencias
  conservan sus respectivas licencias upstream.

Importante: el manifiesto de versiones conserva la línea `configuration` de
FFmpeg. Si su configuración efectiva termina habilitando GPL, componentes
nonfree, libx264 o libx265, el responsable del release debe revisar las
obligaciones correspondientes antes de publicarlo. Reproducir/remultiplexar
H.264/AAC no requiere esos codificadores.

Este archivo es un inventario técnico, no sustituye los textos de licencia ni
constituye asesoría legal.
