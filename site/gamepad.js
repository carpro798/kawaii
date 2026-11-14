/**
 * KAWAII ANIMES — Soporte Completo de Mando (Gamepad) y Control Remoto (Android TV)
 * Spatial Navigation + Gamepad API + TV Remote + Audio Feedback + HUD
 */

(function() {
  'use strict';

  // Audio sintetizado suave para navegación estilo consola / Android TV
  let audioCtx = null;
  function playTickSound(pitch = 440) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // Estado del motor de mando/TV
  const TV_STATE = {
    active: false,
    focusedElement: null,
    lastGamepadPoll: 0,
    axisThrottle: { x: 0, y: 0 },
    btnThrottle: {},
    hudTimer: null,
    connectedGamepadName: null
  };

  // Selector exhaustivo de todos los elementos navegables
  const FOCUSABLE_SELECTOR = [
    '.v-card',
    '.h-card',
    '.nav-btn',
    '.netflix-profile-card',
    '.hero-btn',
    '.cat-pill',
    '.genre-palette-btn',
    '.frame-item-card',
    '.episode-btn',
    '.explore-load-more-btn',
    '.btn',
    '.player-ctrl-btn',
    '.close-modal-btn',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'a[href]'
  ].join(', ');

  // Activa el modo TV en el body
  function enableTvMode() {
    if (!document.body.classList.contains('tv-mode')) {
      document.body.classList.add('tv-mode');
      TV_STATE.active = true;
      showGamepadHud();
    }
  }

  // Muestra el HUD con la ayuda visual del mando en la esquina
  function showGamepadHud(name) {
    let hud = document.getElementById('gamepad-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'gamepad-hud';
      hud.className = 'gamepad-hud';
      hud.innerHTML = `
        <span style="font-size:1.1rem;">🎮</span>
        <span id="gamepad-hud-title" style="color:var(--primary); font-weight:700;">Modo TV / Mando</span>
        <div class="gamepad-hud-pill"><span class="gamepad-hud-btn">A</span> Seleccionar</div>
        <div class="gamepad-hud-pill"><span class="gamepad-hud-btn" style="background:#555;">B</span> Volver</div>
        <div class="gamepad-hud-pill"><span class="gamepad-hud-btn" style="background:#2563eb;">Y</span> Buscar</div>
      `;
      document.body.appendChild(hud);
    }
    if (name) {
      const titleEl = document.getElementById('gamepad-hud-title');
      if (titleEl) titleEl.innerText = name.length > 20 ? name.substring(0, 18) + '...' : name;
    }
    hud.classList.add('visible');

    clearTimeout(TV_STATE.hudTimer);
    TV_STATE.hudTimer = setTimeout(() => {
      hud.classList.remove('visible');
    }, 5000);
  }

  // Obtiene los elementos navegables según el contexto actual (si hay modal, limita al modal)
  function getCandidateElements() {
    // 1. Si el reproductor está abierto
    const playerModal = document.getElementById('player-modal');
    if (playerModal && playerModal.classList.contains('active')) {
      return Array.from(playerModal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isElementVisible);
    }

    // 2. Si la pantalla de perfiles Netflix está abierta
    const netflixScreen = document.getElementById('netflix-screen');
    if (netflixScreen && netflixScreen.classList.contains('active')) {
      return Array.from(netflixScreen.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isElementVisible);
    }

    // 3. Si hay cualquier otro modal activo
    const activeModals = document.querySelectorAll('.modal.active, .frame-modal-overlay.active');
    for (const m of activeModals) {
      const candidates = Array.from(m.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isElementVisible);
      if (candidates.length) return candidates;
    }

    // 4. Vista principal activa + Barra lateral
    const activeSection = document.querySelector('.view-section.active') || document.getElementById('view-inicio');
    const sidebar = document.getElementById('sidebar');

    const viewElements = activeSection ? Array.from(activeSection.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
    const sidebarElements = sidebar ? Array.from(sidebar.querySelectorAll(FOCUSABLE_SELECTOR)) : [];

    return [...sidebarElements, ...viewElements].filter(isElementVisible);
  }

  function isElementVisible(el) {
    if (!el || el.disabled || el.offsetParent === null) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Asigna el foco a un elemento de forma limpia
  function focusElement(el, playSound = true) {
    if (!el) return;

    if (TV_STATE.focusedElement && TV_STATE.focusedElement !== el) {
      TV_STATE.focusedElement.classList.remove('tv-focused');
    }

    TV_STATE.focusedElement = el;
    el.classList.add('tv-focused');

    try {
      el.focus({ preventScroll: true });
    } catch (e) {}

    // Si el elemento está en un carrusel horizontal, desplazar suavemente el carrusel
    const carouselTrack = el.closest('.carousel-track');
    if (carouselTrack) {
      const trackRect = carouselTrack.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = (elRect.left + elRect.width / 2) - (trackRect.left + trackRect.width / 2);
      carouselTrack.scrollBy({ left: offset, behavior: 'smooth' });
    }

    // Desplazamiento vertical si está fuera de pantalla
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    if (playSound) {
      playTickSound(520);
    }
  }

  // Algoritmo de Navegación Espacial (busca el elemento más cercano en la dirección)
  function navigate(direction) {
    enableTvMode();
    const candidates = getCandidateElements();
    if (!candidates.length) return;

    let current = TV_STATE.focusedElement;
    if (!current || !document.body.contains(current) || !isElementVisible(current)) {
      // Si no hay foco previo, enfocar el primer elemento relevante
      const initial = candidates.find(c => c.classList.contains('hero-btn') || c.classList.contains('v-card') || c.classList.contains('netflix-profile-card')) || candidates[0];
      focusElement(initial);
      return;
    }

    const curRect = current.getBoundingClientRect();
    const curCx = curRect.left + curRect.width / 2;
    const curCy = curRect.top + curRect.height / 2;

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const c of candidates) {
      if (c === current) continue;
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      const dx = cx - curCx;
      const dy = cy - curCy;

      let isInDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (direction) {
        case 'right':
          if (dx > 8) {
            isInDirection = true;
            primaryDist = dx;
            secondaryDist = Math.abs(dy);
          }
          break;
        case 'left':
          if (dx < -8) {
            isInDirection = true;
            primaryDist = -dx;
            secondaryDist = Math.abs(dy);
          }
          break;
        case 'down':
          if (dy > 8) {
            isInDirection = true;
            primaryDist = dy;
            secondaryDist = Math.abs(dx);
          }
          break;
        case 'up':
          if (dy < -8) {
            isInDirection = true;
            primaryDist = -dy;
            secondaryDist = Math.abs(dx);
          }
          break;
      }

      if (isInDirection) {
        // Ponderar distancia: dar preferencia a elementos en la misma línea visual
        const dist = primaryDist + secondaryDist * 2.2;
        if (dist < minDistance) {
          minDistance = dist;
          bestCandidate = c;
        }
      }
    }

    if (bestCandidate) {
      focusElement(bestCandidate);
    }
  }

  // Activa (clic) sobre el elemento enfocado
  function activateCurrent() {
    enableTvMode();
    const el = TV_STATE.focusedElement;
    if (!el) {
      const candidates = getCandidateElements();
      if (candidates.length) focusElement(candidates[0]);
      return;
    }

    playTickSound(700);

    // Si es un input, hacer focus
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      el.focus();
      return;
    }

    el.click();
  }

  // Acción de "Atrás / Volver" (Botón B o Escape o Android TV Back)
  function handleBack() {
    enableTvMode();
    playTickSound(350);

    // 1. Cerrar reproductor si está abierto
    const playerModal = document.getElementById('player-modal');
    if (playerModal && playerModal.classList.contains('active')) {
      if (window.closePlayer) window.closePlayer();
      else if (window.closeModal) window.closeModal('player-modal');
      return;
    }

    // 2. Cerrar detalle de anime si está abierto
    const detailModal = document.getElementById('detail-modal');
    if (detailModal && detailModal.classList.contains('active')) {
      if (window.closeModal) window.closeModal('detail-modal');
      return;
    }

    // 3. Cerrar selector de marcos / apariencia
    const appModal = document.getElementById('appearance-modal');
    if (appModal && appModal.classList.contains('active')) {
      if (window.closeAppearanceModal) window.closeAppearanceModal();
      return;
    }

    // 4. Cerrar cualquier modal abierto
    const activeModals = document.querySelectorAll('.modal.active');
    if (activeModals.length) {
      activeModals.forEach(m => m.classList.remove('active'));
      return;
    }

    // 5. Si está en una subvista, volver a Inicio
    if (window.location.hash && window.location.hash !== '#inicio') {
      window.location.hash = '#inicio';
      return;
    }
  }

  // Acción Rápida: Buscar (Botón Y)
  function handleQuickSearch() {
    enableTvMode();
    window.location.hash = '#buscar';
    setTimeout(() => {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        focusElement(searchInput);
        searchInput.focus();
      }
    }, 150);
  }

  // Acción Rápida: Siguiente / Anterior episodio (Bumpers LB/RB)
  function handleEpisodeStep(direction) {
    enableTvMode();
    const playerModal = document.getElementById('player-modal');
    if (playerModal && playerModal.classList.contains('active') && window.STATE?.activeAnime) {
      const currentEp = window.STATE.activeEpisode || 1;
      const targetEp = direction === 'next' ? currentEp + 1 : currentEp - 1;
      if (targetEp >= 1) {
        if (window.openPlayer) window.openPlayer(window.STATE.activeAnime.id, targetEp);
      }
    }
  }

  // ── 1. MANEJO DE TECLAS (Control Remoto Android TV + Teclado) ───────────────
  window.addEventListener('keydown', function(e) {
    const key = e.key;
    const code = e.keyCode;

    // Teclas de dirección (D-Pad del control remoto de Android TV)
    if (key === 'ArrowUp' || code === 38 || code === 19) { // 19 = DPAD_UP en Android
      e.preventDefault();
      navigate('up');
    } else if (key === 'ArrowDown' || code === 40 || code === 20) { // 20 = DPAD_DOWN
      e.preventDefault();
      navigate('down');
    } else if (key === 'ArrowLeft' || code === 37 || code === 21) { // 21 = DPAD_LEFT
      e.preventDefault();
      navigate('left');
    } else if (key === 'ArrowRight' || code === 39 || code === 22) { // 22 = DPAD_RIGHT
      e.preventDefault();
      navigate('right');
    } else if (key === 'Enter' || code === 13 || code === 23 || code === 66) { // 23 = DPAD_CENTER / 66 = ENTER
      // Si el foco está en un input y presiona enter, no previene para permitir búsqueda
      if (document.activeElement?.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
      activateCurrent();
    } else if (key === 'Escape' || key === 'Back' || key === 'BrowserBack' || code === 27 || code === 4) { // 4 = BACK en Android TV
      e.preventDefault();
      handleBack();
    } else if (key === 'Backspace' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      handleBack();
    } else if (key === 'f' || key === 'F') {
      // Alternar pantalla completa
      if (document.activeElement?.tagName !== 'INPUT') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  });

  // Si se usa el ratón, mantener soporte sin estorbar
  window.addEventListener('mousemove', function() {
    // No desactiva el modo TV por completo para no perder compatibilidad mixta,
    // pero permite interacción normal con ratón
  });

  // ── 2. GAMEPAD API POLLING LOOP (Mandos Xbox, PlayStation, USB, Bluetooth) ─
  let animFrameId = null;
  const AXIS_THRESHOLD = 0.5;
  const REPEAT_INITIAL_DELAY = 240;
  const REPEAT_INTERVAL = 130;

  function processGamepadInput(gamepad) {
    if (!gamepad) return;

    const now = performance.now();

    // 1. Sticks analógicos (Stick Izquierdo)
    const axisX = gamepad.axes[0] || 0;
    const axisY = gamepad.axes[1] || 0;

    // D-Pad buttons (standard mapping: 12=Up, 13=Down, 14=Left, 15=Right)
    const dpadUp = gamepad.buttons[12]?.pressed;
    const dpadDown = gamepad.buttons[13]?.pressed;
    const dpadLeft = gamepad.buttons[14]?.pressed;
    const dpadRight = gamepad.buttons[15]?.pressed;

    const wantUp = dpadUp || axisY < -AXIS_THRESHOLD;
    const wantDown = dpadDown || axisY > AXIS_THRESHOLD;
    const wantLeft = dpadLeft || axisX < -AXIS_THRESHOLD;
    const wantRight = dpadRight || axisX > AXIS_THRESHOLD;

    function handleDirThrottle(dir, isPressed) {
      if (!isPressed) {
        TV_STATE.axisThrottle[dir] = 0;
        return;
      }
      const lastTime = TV_STATE.axisThrottle[dir] || 0;
      if (lastTime === 0) {
        navigate(dir);
        TV_STATE.axisThrottle[dir] = now + REPEAT_INITIAL_DELAY;
      } else if (now > lastTime) {
        navigate(dir);
        TV_STATE.axisThrottle[dir] = now + REPEAT_INTERVAL;
      }
    }

    handleDirThrottle('up', wantUp);
    handleDirThrottle('down', wantDown);
    handleDirThrottle('left', wantLeft);
    handleDirThrottle('right', wantRight);

    // Botones de acción
    function handleBtnPress(idx, callback) {
      const btn = gamepad.buttons[idx];
      const pressed = btn?.pressed || btn?.value > 0.5;
      const wasPressed = TV_STATE.btnThrottle[idx];

      if (pressed && !wasPressed) {
        TV_STATE.btnThrottle[idx] = true;
        callback();
      } else if (!pressed && wasPressed) {
        TV_STATE.btnThrottle[idx] = false;
      }
    }

    // Botón A / Cross (Botón 0): Confirmar / Seleccionar
    handleBtnPress(0, activateCurrent);

    // Botón B / Circle (Botón 1): Volver / Salir
    handleBtnPress(1, handleBack);

    // Botón X / Square (Botón 2): Acción rápida
    handleBtnPress(2, () => {
      // Si está en detalle de anime, agregar/quitar favoritos
      if (window.toggleCurrentAnimeFavorite) {
        window.toggleCurrentAnimeFavorite();
      } else {
        handleEpisodeStep('prev');
      }
    });

    // Botón Y / Triangle (Botón 3): Ir a Buscar
    handleBtnPress(3, handleQuickSearch);

    // LB / L1 (Botón 4): Episodio Anterior
    handleBtnPress(4, () => handleEpisodeStep('prev'));

    // RB / R1 (Botón 5): Siguiente Episodio
    handleBtnPress(5, () => handleEpisodeStep('next'));

    // Botón Select / Back (Botón 8)
    handleBtnPress(8, handleBack);

    // Botón Start / Menu (Botón 9): Reproducir / Pausa / Fullscreen
    handleBtnPress(9, () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  function gamepadLoop() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let hasConnected = false;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        hasConnected = true;
        processGamepadInput(gp);
        break; // Procesar el primer mando activo
      }
    }

    animFrameId = requestAnimationFrame(gamepadLoop);
  }

  window.addEventListener('gamepadconnected', function(e) {
    const gp = e.gamepad;
    TV_STATE.connectedGamepadName = gp.id || 'Mando Estándar';
    enableTvMode();
    showGamepadHud(gp.id);
    if (window.showToast) {
      window.showToast(`🎮 Mando detectado: ${gp.id.split('(')[0]}`);
    }

    // Autoenfocar si no hay foco
    setTimeout(() => {
      const candidates = getCandidateElements();
      if (candidates.length && !TV_STATE.focusedElement) {
        focusElement(candidates[0]);
      }
    }, 200);
  });

  window.addEventListener('gamepaddisconnected', function(e) {
    if (window.showToast) {
      window.showToast('🎮 Mando desconectado');
    }
  });

  // Iniciar el ciclo de polling
  animFrameId = requestAnimationFrame(gamepadLoop);

  // Iniciar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    // No pre-enfocar automáticamente: el borde TV solo aparece si el usuario usa teclado/mando
  });

  // Exportar al ámbito global para integración con app.js
  window.TV_ENGINE = {
    enableTvMode,
    focusElement,
    navigate,
    activateCurrent,
    handleBack,
    showGamepadHud
  };

})();

