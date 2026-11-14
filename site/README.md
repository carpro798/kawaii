# KuroHoshi — Servidor & Web App

Réplica completa y moderna de la aplicación **KuroHoshi**, con catálogo oficial, descifrado de episodios de `kawaii.db`, servidor de hosting local y protección anti-publicidad.

---

## 🚀 Cómo usar tu PC como servidor de Hosting

Para ver tus animes en esta PC o en **tu teléfono móvil, Smart TV o tablet conectados al mismo Wi-Fi**:

1. Haz doble clic en el archivo [**`Iniciar Servidor Hosting.bat`**](file:///c:/Users/HP/AppData/Local/Kawaii%20Animes/Iniciar%20Servidor%20Hosting.bat).
2. Verás la pantalla del servidor indicando las direcciones:
   - **En esta PC:** `http://localhost:3000` (se abrirá automáticamente).
   - **En tu Móvil, Tablet o Smart TV:** `http://192.168.10.7:3000` (o la IP que indique la consola).

---

## 🌐 Cómo subirlo a un Hosting Online (Vercel, Netlify o GitHub Pages)

Todo el sitio web está listo para desplegar en un solo paso:
- **Netlify:** Arrastra la carpeta `site/` a [app.netlify.com/drop](https://app.netlify.com/drop) y tendrás tu web anime online gratis con HTTPS.
- **Vercel:** Puedes subir la carpeta usando `vercel deploy` o conectando tu repositorio de GitHub (ya incluye `vercel.json`).
- **GitHub Pages:** Sube los archivos de `site/` a una rama `gh-pages` en GitHub.

---

## 🛡️ Mejoras añadidas

1. **Bloqueo de Popups y Redirecciones:**
   - El reproductor ahora cuenta con aislamiento `sandbox` en los iframes, bloqueando que los servidores de video abran ventanas emergentes (`popups`) o te redirijan a otras páginas.
2. **Botón de Descarga MP4:**
   - Botón directo **📥 Descargar MP4** tanto en el reproductor como en la ficha técnica del anime para descargar el capítulo directamente.
3. **Múltiples Servidores e Idiomas:**
   - Cada capítulo tiene sus opciones de servidor (*Delta, Gamma, Epsilon, Alpha*) y audio (*Japonés Sub, Español Latino, Castellano*).


---

## 🎮 Soporte para Mandos y Control Remoto (Android TV / Smart TV / PC)

La web incluye compatibilidad nativa con mandos de consola (Xbox, PlayStation, mandos USB/Bluetooth) y controles remotos de **Android TV / Google TV / Fire TV**:

### 🎯 Controles en Android TV / Control Remoto:
| Botón / Tecla | Acción |
|---------------|--------|
| **D-Pad (Flechas Arriba/Abajo/Izquierda/Derecha)** | Navegación espacial fluida entre animes, menús y opciones |
| **OK / Enter / Centro** | Seleccionar / Abrir anime / Reproducir capítulo |
| **Atrás (Back / Return)** | Cerrar reproductor, cerrar ficha de anime o volver al inicio |
| **F** | Alternar modo pantalla completa |

### 🎮 Controles con Mando (Gamepad Xbox / PlayStation):
| Botón | Acción |
|-------|--------|
| **D-Pad / Stick Izquierdo** | Moverse suavemente entre el catálogo y opciones |
| **(A) / ✕ (Cross)** | Seleccionar anime, entrar a ver capítulo |
| **(B) / ◯ (Círculo)** | Volver / Cerrar reproductor o modal |
| **(X) / ▢ (Cuadrado)** | Añadir / Quitar de Favoritos de forma instantánea |
| **(Y) / △ (Triángulo)** | Abrir el buscador directo |
| **LB / L1** | Capítulo anterior |
| **RB / R1** | Siguiente capítulo |
| **Start / Menú** | Pantalla completa |

> Al conectar un mando o pulsar una flecha del control remoto, la aplicación entra automáticamente en **Modo TV**, destacando cada elemento con un borde brillante rojo de alto contraste y sonido sutil de respuesta estilo consola.
