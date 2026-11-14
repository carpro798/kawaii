/**
 * KAWAII ANIMES — Web Application Engine
 * Replica exacta de la App Original + Perfiles estilo Netflix + Carga de fotos personalizadas
 */

// Global State
const STATE = {
  animes: window.KAWAII_ANIMES || [],
  currentView: 'inicio',
  activeAnime: null,
  activeEpisode: 1,
  currentServer: localStorage.getItem('kurohoshi_preferred_server') || 'epsilon',
  currentLanguage: 'sub',
  activeProfile: null,
  exploreFilter: 'animes',
  explorePage: 0,
  tempUploadedAvatar: null
};

// Illustrated Frames
const AVATAR_FRAMES = [
  { id: 'profile_frame_basic_sakura.webp', name: 'Sakura Clásica' },
  { id: 'profile_frame_gojo_illustrated.webp', name: 'Satoru Gojo' },
  { id: 'profile_frame_kimetsu_no_yaiba_illustrated.webp', name: 'Kimetsu' },
  { id: 'profile_frame_one_piece_illustrated.webp', name: 'One Piece' },
  { id: 'profile_frame_naruto_illustrated.webp', name: 'Naruto' },
  { id: 'profile_frame_solo_leveling_illustrated.webp', name: 'Solo Leveling' },
  { id: 'profile_frame_dragon_ball_illustrated.webp', name: 'Dragon Ball' },
  { id: 'profile_frame_bleach_illustrated.webp', name: 'Bleach' },
  { id: 'profile_frame_attack_on_titan_illustrated.webp', name: 'Shingeki' },
  { id: 'profile_frame_black_clover_illustrated.webp', name: 'Black Clover' },
  { id: 'profile_frame_sailor_moon_illustrated.webp', name: 'Sailor Moon' },
  { id: 'profile_frame_basic_fire.webp', name: 'Fuego Carmesí' },
  { id: 'profile_frame_basic_electro.webp', name: 'Rayo Eléctrico' },
  { id: 'profile_frame_basic_wave.webp', name: 'Ola Marina' },
  { id: 'profile_frame_basic_stars.webp', name: 'Estrellas' }
];

// Presets de avatares kawaii
const PRESET_AVATARS = [
  'assets/splash_robot.webp',
  'assets/profile_favorites_mascot.webp',
  'assets/profile_watching_mascot.webp',
  'assets/profile_completed_mascot.webp',
  'assets/profile_watch_later_mascot.webp',
  'assets/splash_hologram.webp'
];

// 40 Géneros con colores exactos de Screenshot 5
const GENRES_PALETTE = [
  { name: 'Acción', color: '#5e17eb' },
  { name: 'Artes Marciales', color: '#9d4816' },
  { name: 'Aventura', color: '#169d32' },
  { name: 'Ciencia Ficción', color: '#2b7474' },
  { name: 'Comedia', color: '#1793c7' },
  { name: 'Deportes', color: '#0b6d51' },
  { name: 'Detectives', color: '#867f16' },
  { name: 'Drama', color: '#7d4374' },
  { name: 'Ecchi', color: '#9b166d' },
  { name: 'Escolar', color: '#092289' },
  { name: 'Espacio', color: '#8b7a13' },
  { name: 'Fantasía', color: '#7f1228' },
  { name: 'Gore', color: '#451475' },
  { name: 'Harem', color: '#0b4c2b' },
  { name: 'Histórico', color: '#853d1b' },
  { name: 'Horror', color: '#631526' },
  { name: 'Isekai', color: '#7d5483' },
  { name: 'Josei', color: '#428b12' },
  { name: 'Juegos', color: '#094982' },
  { name: 'Mahou Shoujo', color: '#416b5a' },
  { name: 'Mecha', color: '#348e10' },
  { name: 'Militar', color: '#0e3e78' },
  { name: 'Misterio', color: '#781934' },
  { name: 'Mitológico', color: '#8d1473' },
  { name: 'Musica', color: '#0b579d' },
  { name: 'Parodia', color: '#8d7515' },
  { name: 'Psicológico', color: '#5e138a' },
  { name: 'Recuentos De La Vida', color: '#897c26' },
  { name: 'Romance', color: '#871329' },
  { name: 'Samurais', color: '#0d6b4a' },
  { name: 'Seinen', color: '#4a7813' },
  { name: 'Shoujo', color: '#911468' },
  { name: 'Shoujo Ai', color: '#7a2b85' },
  { name: 'Shounen', color: '#8a7114' },
  { name: 'Shounen Ai', color: '#147291' },
  { name: 'Sobrenatural', color: '#0b4929' },
  { name: 'Soft Hentai', color: '#8f186c' },
  { name: 'Super Poderes', color: '#9b4317' },
  { name: 'Suspenso', color: '#416260' },
  { name: 'Vampiros', color: '#0b3c7d' }
];

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initAppProtectionAndShortcuts();
  initProfiles();
  initRouter();
  initSakuraPetals();
  initHeroSlider();
  initHomeCarousels();
  initGenresView();
  initExploreView();
  initCalendarView();
  initPresetAvatars();
  initEntranceAnimation();
});

/* ==========================================================================
   PERFILES ESTILO NETFLIX (Cuentas Separadas & Aisladas)
   ========================================================================== */
function getStoredProfiles() {
  const raw = localStorage.getItem('kurohoshi_profiles') || localStorage.getItem('kawaii_profiles');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { }
  }
  // Perfil por defecto inicial (Carpro798 como en Screenshot 6)
  const defaultProfile = {
    id: 'p_default',
    name: 'Carpro798',
    avatar: 'assets/splash_robot.webp',
    frame: 'profile_frame_basic_sakura.webp',
    points: 3,
    lists: {
      favorites: [584, 2077, 1367, 2025, 45, 192, 293, 2022, 897, 272],
      watching: [2095, 872, 2253, 385, 2025, 2187],
      watchLater: [5, 12, 1076, 271],
      completed: [1]
    },
    viewedEpisodes: { '1_1': true, '2095_1': true },
    lastWatchedEp: { '1': 1, '2095': 1 },
    settings: { autoNext: true, countdown: true, doh: false }
  };
  saveProfiles([defaultProfile]);
  return [defaultProfile];
}

function saveProfiles(profiles) {
  localStorage.setItem('kurohoshi_profiles', JSON.stringify(profiles));
  localStorage.setItem('kawaii_profiles', JSON.stringify(profiles));
}

let _introSkipped = false;

window.skipIntroSplash = function () {
  if (_introSkipped) return;
  _introSkipped = true;
  const splash = document.getElementById('intro-splash');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.remove();
      showNetflixScreen();
    }, 450);
  } else {
    showNetflixScreen();
  }
};

function playCinematicBoom() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Sub-bass drop cinemático estilo Netflix "Ta-dum"
    const oscBass = ctx.createOscillator();
    const gainBass = ctx.createGain();
    oscBass.type = 'sine';
    oscBass.frequency.setValueAtTime(115, now);
    oscBass.frequency.exponentialRampToValueAtTime(32, now + 0.95);
    gainBass.gain.setValueAtTime(0.3, now);
    gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    oscBass.connect(gainBass);
    gainBass.connect(ctx.destination);
    oscBass.start(now);
    oscBass.stop(now + 1.25);

    // Acorde de apertura cósmica brillante
    [220, 277.18, 329.63, 440].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.12);
      gain.gain.setValueAtTime(0.025, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5 + idx * 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.12);
      osc.stop(now + 1.6);
    });
  } catch (e) { }
}

function playProfileWarpSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.38);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  } catch (e) { }
}

function startCinematicIntro() {
  const splash = document.getElementById('intro-splash');
  if (!splash) {
    showNetflixScreen();
    return;
  }
  playCinematicBoom();
  setTimeout(() => {
    skipIntroSplash();
  }, 2300);
}

function initProfiles() {
  renderNetflixProfilesGrid();
  startCinematicIntro();
}

function renderNetflixProfilesGrid() {
  const container = document.getElementById('netflix-profiles-grid');
  if (!container) return;
  const profiles = getStoredProfiles();

  container.innerHTML = `
    ${profiles.map(p => `
      <div class="netflix-profile-card" onclick="selectProfile('${p.id}')">
        <div class="netflix-avatar-wrap">
          <img src="${p.avatar}" alt="${p.name}" class="netflix-avatar-img" onerror="this.src='assets/splash_robot.webp'">
        </div>
        <div class="netflix-profile-name">${p.name}</div>
      </div>
    `).join('')}
    <div class="netflix-profile-card netflix-card-add" onclick="openCreateProfileModal()">
      <div class="netflix-avatar-wrap">
        <span class="netflix-add-icon">+</span>
      </div>
      <div class="netflix-profile-name">Agregar perfil</div>
    </div>
  `;
}

function showNetflixScreen() {
  const modal = document.getElementById('netflix-screen');
  if (modal) modal.classList.add('active');
}

function hideNetflixScreen() {
  const modal = document.getElementById('netflix-screen');
  if (modal) modal.classList.remove('active');
}

window.selectProfile = function (profileId, animate = true) {
  const profiles = getStoredProfiles();
  const profile = profiles.find(p => p.id === profileId) || profiles[0];
  if (!profile) return;

  STATE.activeProfile = profile;
  localStorage.setItem('kurohoshi_active_profile_id', profile.id);
  localStorage.setItem('kawaii_active_profile_id', profile.id);

  // Animación cinematográfica de selección de perfil:
  // La tarjeta seleccionada hace zoom in hacia la pantalla y las demás se difuminan
  const cards = document.querySelectorAll('.netflix-profile-card');
  cards.forEach(card => {
    if (card.getAttribute('onclick')?.includes(profileId)) {
      card.classList.add('profile-card-selected-zoom');
    } else {
      card.classList.add('profile-card-fade-out');
    }
  });

  const netflixTitle = document.querySelector('.netflix-title');
  const netflixActions = document.querySelector('.netflix-actions');
  const netflixLogo = document.querySelector('.netflix-logo');
  [netflixTitle, netflixActions, netflixLogo].forEach(el => {
    if (el) el.classList.add('profile-card-fade-out');
  });

  playProfileWarpSound();

  // Transición suave hacia el inicio
  setTimeout(() => {
    updateUserProfileUI();
    hideNetflixScreen();
    renderKeepWatching();
    renderProfileLibrary();

    // Restaurar clases limpias por si se vuelve a cerrar sesión
    cards.forEach(card => {
      card.classList.remove('profile-card-selected-zoom', 'profile-card-fade-out');
    });
    [netflixTitle, netflixActions, netflixLogo].forEach(el => {
      if (el) el.classList.remove('profile-card-fade-out');
    });

    // Iniciar animación de entrada
    runEntranceAnimation();

    if (animate) {
      showToast(`⭐ ¡Bienvenido a KuroHoshi, ${profile.name}!`);
    }
  }, 680);
};

window.logoutToNetflixScreen = function () {
  renderNetflixProfilesGrid();
  showNetflixScreen();
};

function updateUserProfileUI() {
  const p = STATE.activeProfile;
  if (!p) return;

  // Sidebar Avatar
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  if (sidebarAvatar) sidebarAvatar.src = p.avatar;

  // Profile View
  const mainAvatar = document.getElementById('profile-main-avatar');
  const mainFrame = document.getElementById('profile-main-frame');
  const username = document.getElementById('profile-username');
  const pointsBadge = document.getElementById('profile-points-badge');

  if (mainAvatar) mainAvatar.src = p.avatar;
  if (mainFrame) mainFrame.src = `assets/${p.frame || 'profile_frame_basic_sakura.webp'}`;
  if (username) username.innerText = p.name;
  if (pointsBadge) pointsBadge.innerText = `⭐ ${p.points || 0} KuroHoshi Points`;

  // Unique animes count
  const allIds = new Set([
    ...(p.lists.favorites || []),
    ...(p.lists.watching || []),
    ...(p.lists.watchLater || []),
    ...(p.lists.completed || [])
  ]);
  const uniqueEl = document.getElementById('profile-unique-animes');
  if (uniqueEl) uniqueEl.innerText = `${allIds.size} animes únicos en tus listas`;
}

function updateActiveProfileInStorage() {
  if (!STATE.activeProfile) return;
  const profiles = getStoredProfiles();
  const idx = profiles.findIndex(p => p.id === STATE.activeProfile.id);
  if (idx >= 0) {
    profiles[idx] = STATE.activeProfile;
  } else {
    profiles.push(STATE.activeProfile);
  }
  saveProfiles(profiles);
}

// ── Crear nuevo perfil ──────────────────────────────────────────────────────
window.openCreateProfileModal = function () {
  const modal = document.getElementById('create-profile-modal');
  const input = document.getElementById('new-profile-name');
  const preview = document.getElementById('new-profile-preview');
  if (input) input.value = '';
  if (preview) preview.src = PRESET_AVATARS[0];
  STATE.tempUploadedAvatar = PRESET_AVATARS[0];
  if (modal) modal.classList.add('active');
};

window.confirmCreateProfile = function () {
  const input = document.getElementById('new-profile-name');
  const name = (input ? input.value : '').trim() || `Usuario ${Date.now().toString().slice(-4)}`;
  const avatar = STATE.tempUploadedAvatar || PRESET_AVATARS[0];

  const newProfile = {
    id: 'p_' + Date.now(),
    name: name,
    avatar: avatar,
    frame: 'profile_frame_basic_sakura.webp',
    points: 0,
    lists: { favorites: [], watching: [], watchLater: [], completed: [] },
    viewedEpisodes: {},
    lastWatchedEp: {},
    settings: { autoNext: true, countdown: true, doh: false }
  };

  const profiles = getStoredProfiles();
  profiles.push(newProfile);
  saveProfiles(profiles);

  closeModal('create-profile-modal');
  renderNetflixProfilesGrid();
  selectProfile(newProfile.id);
  showToast(`✨ Perfil creado para ${name}`);
};

// ── Editar perfil actual (Nombre y Foto) ──────────────────────────────────
window.openEditProfileModal = function () {
  if (!STATE.activeProfile) return;
  const modal = document.getElementById('edit-profile-modal');
  const input = document.getElementById('edit-profile-name');
  const preview = document.getElementById('edit-profile-preview');

  if (input) input.value = STATE.activeProfile.name;
  if (preview) preview.src = STATE.activeProfile.avatar;
  STATE.tempUploadedAvatar = STATE.activeProfile.avatar;

  if (modal) modal.classList.add('active');
};

window.confirmEditProfile = function () {
  if (!STATE.activeProfile) return;
  const input = document.getElementById('edit-profile-name');
  const newName = (input ? input.value : '').trim();

  if (newName) STATE.activeProfile.name = newName;
  if (STATE.tempUploadedAvatar) STATE.activeProfile.avatar = STATE.tempUploadedAvatar;

  updateActiveProfileInStorage();
  updateUserProfileUI();
  closeModal('edit-profile-modal');
  showToast('✓ Perfil actualizado con éxito');
};

// ── Manejo de subida de imagen propia desde PC/Móvil ─────────────────────
window.handleProfileImageUpload = function (event, previewId) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    STATE.tempUploadedAvatar = dataUrl;
    const preview = document.getElementById(previewId);
    if (preview) preview.src = dataUrl;
    showToast('📷 Imagen cargada');
  };
  reader.readAsDataURL(file);
};

function initPresetAvatars() {
  const containers = ['preset-avatars-new', 'preset-avatars-edit'];
  containers.forEach(cid => {
    const el = document.getElementById(cid);
    if (!el) return;
    el.innerHTML = PRESET_AVATARS.map(src => `
      <img src="${src}" class="preset-avatar-thumb" onclick="selectPresetAvatar('${src}', '${cid.includes('new') ? 'new-profile-preview' : 'edit-profile-preview'}')">
    `).join('');
  });
}

window.selectPresetAvatar = function (src, previewId) {
  STATE.tempUploadedAvatar = src;
  const preview = document.getElementById(previewId);
  if (preview) preview.src = src;
};

// ── Personalizar apariencia (Marco) ───────────────────────────────────────
window.openAppearanceModal = function () {
  const carousel = document.getElementById('frames-carousel');
  if (carousel) {
    carousel.innerHTML = AVATAR_FRAMES.map(f => `
      <div class="frame-item ${STATE.activeProfile?.frame === f.id ? 'selected' : ''}" onclick="selectFrame('${f.id}')">
        <img class="frame-thumb" src="assets/${f.id}" alt="${f.name}">
        <span class="frame-name">${f.name}</span>
      </div>
    `).join('');
  }
  const modal = document.getElementById('appearance-modal');
  if (modal) modal.classList.add('active');
};

window.selectFrame = function (frameId) {
  if (!STATE.activeProfile) return;
  STATE.activeProfile.frame = frameId;
  updateActiveProfileInStorage();
  updateUserProfileUI();
  document.querySelectorAll('.frame-item').forEach(el => {
    el.classList.toggle('selected', el.innerHTML.includes(frameId));
  });
};

/* ==========================================================================
   ROUTER & NAVEGACIÓN
   ========================================================================== */
function initRouter() {
  const sidebarLinks = document.querySelectorAll('.sidebar-item');
  const viewSections = document.querySelectorAll('.view-section');

  function navigateTo(hash) {
    const viewId = hash.replace('#', '') || 'inicio';
    STATE.currentView = viewId;

    viewSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewId}`);
    });

    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'perfil') {
      renderProfileLibrary();
    } else if (viewId === 'explorar') {
      renderExploreGrid();
    } else if (viewId === 'buscar') {
      renderSearchPopular();
    } else if (viewId === 'descargas') {
      if (typeof refreshDownloads === 'function') refreshDownloads();
    }
  }

  window.addEventListener('hashchange', () => navigateTo(window.location.hash));
  navigateTo(window.location.hash || '#inicio');
}

/* ==========================================================================
   HERO SLIDER
   ========================================================================== */
let heroIndex = 0;
let heroInterval = null;

function initHeroSlider() {
  const container = document.getElementById('hero-slider');
  if (!container || !STATE.animes.length) return;

  const featured = STATE.animes.slice(0, 5);

  container.innerHTML = featured.map((anime, idx) => `
    <div class="hero-slide ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
      <img class="hero-backdrop" src="${anime.banner || anime.poster}" alt="${anime.title}" onerror="this.src='assets/no_image_horizontal.webp'">
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <h1 class="hero-title">${anime.title}</h1>
        <div class="hero-meta-row">
          <span style="color: var(--accent-gold); font-weight:700;">★ ${anime.score}</span>
          <span>·</span>
          <span>${anime.genres ? anime.genres.slice(0, 3).map(capitalize).join(' · ') : 'Anime'}</span>
          <span>·</span>
          <span>${anime.status || 'En emisión'}</span>
        </div>
        <button class="hero-btn" onclick="openPlayer(${anime.id}, 1)">
          <span>▶</span> Ver Anime
        </button>
      </div>
    </div>
  `).join('');

  clearInterval(heroInterval);
  heroInterval = setInterval(() => {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    heroIndex = (heroIndex + 1) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === heroIndex));
  }, 7000);
}

/* ==========================================================================
   CAROUSELS DE INICIO (Estilo Screenshot 1 & 2)
   ========================================================================== */
function initHomeCarousels() {
  renderKeepWatching();
  renderRecentEpisodes();
  renderRecommendations();
  renderLatinosCarousel();
  renderPopularPosterCarousel();
}

// ── Seguir Viendo (Horizontal 16:9 con barra roja y botón cerrar) ──────────
function renderKeepWatching() {
  const container = document.getElementById('keep-watching-track');
  const section = document.getElementById('section-keep-watching');
  if (!container) return;

  const p = STATE.activeProfile;
  const watchingIds = p?.lists?.watching || [];

  if (watchingIds.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = 'block';

  const items = watchingIds.map(id => STATE.animes.find(a => a.id === id)).filter(Boolean);

  container.innerHTML = items.map(anime => {
    const lastEp = (p.lastWatchedEp && p.lastWatchedEp[anime.id]) || 1;
    return `
      <div class="h-card" onclick="openPlayer(${anime.id}, ${lastEp})">
        <div class="h-card-thumb-wrap shimmer-loading">
          <img src="${anime.banner || anime.poster}" alt="${anime.title}" class="h-card-thumb"
            onload="this.parentElement.classList.remove('shimmer-loading')"
            onerror="this.parentElement.classList.remove('shimmer-loading'); this.src='assets/no_image_horizontal.webp'">
          <button class="h-card-close-btn" onclick="event.stopPropagation(); removeFromWatching(${anime.id})" title="Quitar de la lista">✕</button>
          <div class="h-card-progress-bar">
            <div class="h-card-progress-fill" style="width: 100%;"></div>
          </div>
        </div>
        <div class="h-card-info">
          <div class="h-card-title">${anime.title}</div>
          <div class="h-card-sub">Episodio ${lastEp}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.removeFromWatching = function (animeId) {
  if (!STATE.activeProfile) return;
  STATE.activeProfile.lists.watching = STATE.activeProfile.lists.watching.filter(id => id !== animeId);
  updateActiveProfileInStorage();
  renderKeepWatching();
  renderProfileLibrary();
  showToast('Quitado de Seguir Viendo');
};

// ── Episodios Recientes (16:9 con badge Ep.X) ──────────────────────────────
function renderRecentEpisodes() {
  const container = document.getElementById('recent-episodes-track');
  if (!container) return;

  // Filtrar sólo animes recientes reales (estrenos de temporada 2024-2026),
  // ordenados estrictamente por fecha de emisión más reciente
  const recents = [...STATE.animes]
    .filter(a => a.episodes && a.episodes.length > 0 && a.aired && a.aired >= '2024')
    .sort((a, b) => (b.aired || '').localeCompare(a.aired || ''))
    .slice(0, 15);

  container.innerHTML = recents.map(anime => {
    const latestEp = anime.episodes[anime.episodes.length - 1] || anime.episodes[0];
    const epNum = latestEp ? latestEp.number : anime.episodes.length;
    return `
      <div class="h-card" onclick="openPlayer(${anime.id}, ${epNum})" title="Ver Capítulo ${epNum} de ${anime.title}">
        <div class="h-card-thumb-wrap shimmer-loading">
          <img src="${anime.banner || anime.poster}" alt="${anime.title}" class="h-card-thumb"
            onload="this.parentElement.classList.remove('shimmer-loading')"
            onerror="this.parentElement.classList.remove('shimmer-loading'); this.src='assets/no_image_horizontal.webp'">
          <span class="h-card-badge-right">Ep. ${epNum}</span>
        </div>
        <div class="h-card-info">
          <div class="h-card-title">${anime.title}</div>
          <div class="h-card-sub" style="color: var(--primary);">★ ${anime.score} · Emisión Semanal</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Porque viste... (Vertical posters) ────────────────────────────────────
function renderRecommendations() {
  const container = document.getElementById('recommended-track');
  const titleEl = document.getElementById('recommendation-title');
  if (!container) return;

  const p = STATE.activeProfile;
  const firstFavId = p?.lists?.favorites?.[0] || p?.lists?.watching?.[0] || 1;
  const baseAnime = STATE.animes.find(a => a.id === firstFavId) || STATE.animes[0];

  if (titleEl && baseAnime) {
    titleEl.innerText = `Porque viste ${baseAnime.title}`;
  }

  const list = STATE.animes.slice(10, 24);
  container.innerHTML = list.map(anime => createPosterCardHtml(anime)).join('');
}

// ── Animes Latinos (con badge TV X Cap) ────────────────────────────────────
function renderLatinosCarousel() {
  const container = document.getElementById('latinos-track');
  if (!container) return;

  // Animes that have latino audio in their streams
  const latinos = STATE.animes.filter(a =>
    a.episodes?.some(e => e.streams?.some(s => s.lang === 'lat'))
  ).slice(0, 15);

  const fallback = latinos.length > 0 ? latinos : STATE.animes.slice(15, 30);

  container.innerHTML = fallback.map(anime => `
    <div class="v-card" onclick="openAnimeDetail(${anime.id})">
      <div class="v-card-poster-wrap">
        <img src="${anime.poster}" alt="${anime.title}" class="v-card-poster" onerror="this.src='assets/no_image_vertical.webp'">
        <span class="v-card-tv-badge">📺 ${anime.totalEpisodes || anime.episodes?.length || 1} Cap</span>
      </div>
      <div class="v-card-title">${anime.title}</div>
    </div>
  `).join('');
}

// ── Populares Posters ──────────────────────────────────────────────────────
function renderPopularPosterCarousel() {
  const container = document.getElementById('popular-track');
  if (!container) return;

  const popular = [...STATE.animes].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 15);
  container.innerHTML = popular.map(anime => createPosterCardHtml(anime)).join('');
}

function createPosterCardHtml(anime) {
  return `
    <div class="v-card" onclick="openAnimeDetail(${anime.id})">
      <div class="v-card-poster-wrap shimmer-loading">
        <img src="${anime.poster}" alt="${anime.title}" class="v-card-poster"
          onload="this.parentElement.classList.remove('shimmer-loading')"
          onerror="this.parentElement.classList.remove('shimmer-loading'); this.src='assets/no_image_vertical.webp'">
      </div>
      <div class="v-card-title">${anime.title}</div>
    </div>
  `;
}

/* ==========================================================================
   VIEW: BUSCAR (SEARCH)
   ========================================================================== */
function renderSearchPopular() {
  const grid = document.getElementById('search-grid');
  if (!grid) return;
  const list = STATE.animes.slice(0, 18);
  grid.innerHTML = list.map(anime => createPosterCardHtml(anime)).join('');
}

window.handleSearchInput = function (query) {
  const grid = document.getElementById('search-grid');
  const title = document.getElementById('search-results-title');
  if (!grid) return;

  const q = query.trim().toLowerCase();
  if (!q) {
    if (title) title.innerText = 'Populares';
    renderSearchPopular();
    return;
  }

  if (title) title.innerText = `Resultados para "${query}"`;
  const filtered = STATE.animes.filter(a =>
    a.title.toLowerCase().includes(q) || (a.titleAlt && a.titleAlt.toLowerCase().includes(q))
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 2rem; color: var(--text-muted); text-align:center;">No se encontraron animes para esa búsqueda.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(anime => createPosterCardHtml(anime)).join('');
};

/* ==========================================================================
   VIEW: EXPLORAR (CATALOG)
   ========================================================================== */
function initExploreView() {
  // Marcar botón "Animes" como activo por defecto
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-filter') === STATE.exploreFilter);
  });
  renderExploreGrid();
}

window.setExploreFilter = function (filter, btn) {
  STATE.exploreFilter = filter;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  window.location.hash = '#explorar';
  renderExploreGrid();
};

window.handleExploreSearch = function (query) {
  renderExploreGrid(query.trim().toLowerCase());
};

function renderExploreGrid(searchQuery = '') {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  let list = [...STATE.animes];

  if (STATE.exploreFilter === 'emision') {
    list = list.filter(a => a.status === 'En emisión').sort((a, b) => (b.aired || '').localeCompare(a.aired || ''));
  } else if (STATE.exploreFilter === 'latinos') {
    list = list.filter(a => a.episodes?.some(e => e.streams?.some(s => s.lang === 'lat')));
  } else if (STATE.exploreFilter === 'castellano') {
    list = list.filter(a => a.episodes?.some(e => e.streams?.some(s => s.lang === 'cas')));
  } else if (STATE.exploreFilter === 'peliculas') {
    list = list.filter(a => a.type === 'Movie');
  } else if (STATE.exploreFilter === 'mas_vistos') {
    list.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (STATE.exploreFilter === 'populares') {
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  // 'animes' = todos sin filtro

  if (searchQuery) {
    list = list.filter(a =>
      a.title.toLowerCase().includes(searchQuery) ||
      (a.titleAlt && a.titleAlt.toLowerCase().includes(searchQuery))
    );
  }

  // Store filtered list for load-more
  STATE._exploreList = list;
  STATE._explorePage = 0;

  const PAGE_SIZE = 60;
  const firstSlice = list.slice(0, PAGE_SIZE);
  const remaining = list.length - PAGE_SIZE;

  grid.innerHTML = firstSlice.map(anime => createPosterCardHtml(anime)).join('');

  // Remove old load-more button
  const oldBtn = document.getElementById('explore-load-more');
  if (oldBtn) oldBtn.remove();

  if (remaining > 0) {
    const btn = document.createElement('button');
    btn.id = 'explore-load-more';
    btn.className = 'explore-load-more-btn';
    btn.innerHTML = `Cargar más animes <span>(${Math.min(PAGE_SIZE, remaining)} de ${remaining} restantes)</span> ▾`;
    btn.onclick = loadMoreExplore;
    grid.parentNode.insertBefore(btn, grid.nextSibling);
  }
}

/* ==========================================================================
   LOAD MORE (Explorar paginación lazy)
   ========================================================================== */
function loadMoreExplore() {
  const grid = document.getElementById('explore-grid');
  if (!grid || !STATE._exploreList) return;

  const PAGE_SIZE = 60;
  STATE._explorePage = (STATE._explorePage || 0) + 1;
  const start = STATE._explorePage * PAGE_SIZE;
  const slice = STATE._exploreList.slice(start, start + PAGE_SIZE);
  const remaining = STATE._exploreList.length - (start + PAGE_SIZE);

  slice.forEach(anime => {
    grid.insertAdjacentHTML('beforeend', createPosterCardHtml(anime));
  });

  const btn = document.getElementById('explore-load-more');
  if (btn) {
    if (remaining > 0) {
      btn.innerHTML = `Cargar más animes <span>(${Math.min(PAGE_SIZE, remaining)} de ${remaining} restantes)</span> ▾`;
    } else {
      btn.remove();
    }
  }
}

/* ==========================================================================
   VIEW: GÉNEROS (Paleta de 40 botones exactos)
   ========================================================================== */
function initGenresView() {
  const container = document.getElementById('genres-palette-grid');
  if (!container) return;

  container.innerHTML = GENRES_PALETTE.map(g => `
    <button class="genre-palette-btn" style="background-color: ${g.color};" onclick="filterByGenre('${g.name}')">
      ${g.name}
    </button>
  `).join('');
}

window.filterByGenre = function (genreName) {
  const section = document.getElementById('genre-filtered-section');
  const heading = document.getElementById('genre-filter-heading');
  const grid = document.getElementById('genre-animes-grid');
  if (!section || !grid) return;

  const normalized = genreName.toLowerCase();
  const filtered = STATE.animes.filter(a =>
    a.genres && a.genres.some(g => g.toLowerCase().includes(normalized) || normalized.includes(g.toLowerCase()))
  );

  heading.innerText = `Animes de ${genreName} (${filtered.length})`;
  section.style.display = 'block';

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 2rem; color: var(--text-muted);">No hay animes catalogados para este género en este momento.</div>`;
  } else {
    grid.innerHTML = filtered.map(anime => createPosterCardHtml(anime)).join('');
  }

  section.scrollIntoView({ behavior: 'smooth' });
};

/* ==========================================================================
   VIEW: CALENDARIO SEMANAL
   ========================================================================== */
function initCalendarView() {
  // 0: Lunes, 1: Martes, 2: Miércoles, 3: Jueves, 4: Viernes, 5: Sábado, 6: Domingo
  const todayIdx = (new Date().getDay() + 6) % 7;
  const tabs = document.querySelectorAll('.day-tab');

  // Agregar insignia de "HOY" al día actual
  tabs.forEach((tab, idx) => {
    if (idx === todayIdx && !tab.querySelector('.day-badge-today')) {
      const badge = document.createElement('span');
      badge.className = 'day-badge-today';
      badge.innerText = 'HOY';
      tab.appendChild(badge);
    }
  });

  const targetTab = tabs[todayIdx] || tabs[0];
  setCalendarDay(todayIdx, targetTab);
}

window.setCalendarDay = function (dayIndex, btn) {
  document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const dayAnimes = STATE.animes.filter((_, idx) => idx % 7 === dayIndex);
  grid.innerHTML = dayAnimes.map(anime => createPosterCardHtml(anime)).join('');

  // Animación suave de aparición para las tarjetas del día
  const cards = grid.querySelectorAll('.v-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 22);
  });
};

/* ==========================================================================
   VIEW: PERFIL (Tu Biblioteca, Mascots & Stats)
   ========================================================================== */
function renderProfileLibrary() {
  const p = STATE.activeProfile;
  if (!p) return;

  // Counts
  const favCount = (p.lists.favorites || []).length;
  const watchCount = (p.lists.watching || []).length;
  const compCount = (p.lists.completed || []).length;
  const laterCount = (p.lists.watchLater || []).length;

  const elFav = document.getElementById('count-favorites');
  const elWatch = document.getElementById('count-watching');
  const elComp = document.getElementById('count-completed');
  const elLater = document.getElementById('count-watchLater');

  if (elFav) elFav.innerText = favCount;
  if (elWatch) elWatch.innerText = watchCount;
  if (elComp) elComp.innerText = compCount;
  if (elLater) elLater.innerText = laterCount;

  // Summary bar
  const totalAnimes = new Set([
    ...(p.lists.favorites || []),
    ...(p.lists.watching || []),
    ...(p.lists.watchLater || []),
    ...(p.lists.completed || [])
  ]).size;

  const summaryTotal = document.getElementById('summary-total-animes');
  const summaryDur = document.getElementById('summary-duration');

  if (summaryTotal) summaryTotal.innerText = totalAnimes;
  if (summaryDur) {
    const totalEps = Object.keys(p.viewedEpisodes || {}).length;
    const hours = Math.floor((totalEps * 23) / 60);
    const mins = (totalEps * 23) % 60;
    summaryDur.innerText = `~${hours} h ${mins} min`;
  }

  // Carousels in profile
  const favTrack = document.getElementById('profile-favs-track');
  const favBadge = document.getElementById('profile-favs-badge');
  if (favTrack) {
    const favAnimes = (p.lists.favorites || []).map(id => STATE.animes.find(a => a.id === id)).filter(Boolean);
    favTrack.innerHTML = favAnimes.length > 0 ? favAnimes.map(a => createPosterCardHtml(a)).join('') : '<div style="color:var(--text-muted); padding:1rem;">No tienes favoritos aún.</div>';
    if (favBadge) favBadge.innerText = `Ver todos (${favAnimes.length})`;
  }

  const compTrack = document.getElementById('profile-completed-track');
  const compBadge = document.getElementById('profile-completed-badge');
  if (compTrack) {
    const compAnimes = (p.lists.completed || []).map(id => STATE.animes.find(a => a.id === id)).filter(Boolean);
    compTrack.innerHTML = compAnimes.length > 0 ? compAnimes.map(a => createPosterCardHtml(a)).join('') : '<div style="color:var(--text-muted); padding:1rem;">No has completado ningún anime aún.</div>';
    if (compBadge) compBadge.innerText = `Ver todos (${compAnimes.length})`;
  }
}

window.filterProfileView = function (listType) {
  const p = STATE.activeProfile;
  if (!p) return;
  const ids = p.lists[listType] || [];
  const animes = ids.map(id => STATE.animes.find(a => a.id === id)).filter(Boolean);

  const listsContainer = document.getElementById('profile-library-lists');
  if (!listsContainer) return;

  const names = {
    favorites: 'Favoritos',
    watching: 'Viendo',
    completed: 'Terminados',
    watchLater: 'Ver después'
  };

  listsContainer.innerHTML = `
    <div class="carousel-container">
      <div class="section-header">
        <h2 class="section-title">${names[listType]} (${animes.length})</h2>
        <button class="btn btn-secondary" onclick="renderProfileLibrary()" style="font-size:0.75rem;">Mostrar Todo</button>
      </div>
      <div class="catalog-grid">
        ${animes.length > 0 ? animes.map(a => createPosterCardHtml(a)).join('') : '<div style="color:var(--text-muted); padding:2rem;">Esta lista está vacía actualmente.</div>'}
      </div>
    </div>
  `;
};

/* ==========================================================================
   ANIME DETAIL & USER LIST TOGGLES
   ========================================================================== */
window.openAnimeDetail = function (id) {
  const anime = STATE.animes.find(a => a.id === id);
  if (!anime) return;

  STATE.activeAnime = anime;
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('detail-modal-body');

  content.innerHTML = `
    <div class="detail-header">
      <img class="detail-backdrop" src="${anime.banner || anime.poster}" alt="${anime.title}" onerror="this.src='assets/no_image_horizontal.webp'">
      <div class="detail-gradient"></div>
    </div>
    <div class="detail-body">
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${anime.poster}" alt="${anime.title}" onerror="this.src='assets/no_image_vertical.webp'">
      </div>
      <div class="detail-info" style="flex:1;">
        <h2 class="detail-title">${anime.title}</h2>
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap;">
          <span style="color:var(--accent-gold); font-weight:700;">★ ${anime.score}</span>
          <span>·</span>
          <span>${anime.type || 'TV'}</span>
          <span>·</span>
          <span>${anime.status || 'En emisión'}</span>
        </div>
        <p style="font-size:0.88rem; color:#ccc; line-height:1.5; margin-bottom:1rem; max-height:100px; overflow-y:auto;">
          ${anime.synopsis}
        </p>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;" id="detail-actions-bar">
          <!-- Dynamically populated buttons -->
        </div>
      </div>
    </div>

    <!-- Episodes Grid -->
    <div style="margin-top:1.5rem;">
      <h3 style="margin-bottom:0.75rem;">Capítulos (${anime.episodes?.length || anime.totalEpisodes || 1})</h3>
      <div class="episodes-grid" id="detail-episodes-grid">
        ${renderEpisodesButtons(anime)}
      </div>
    </div>
  `;

  updateDetailButtons(anime.id);
  modal.classList.add('active');

  if (window.TV_ENGINE && document.body.classList.contains('tv-mode')) {
    setTimeout(() => {
      const target = modal.querySelector('.btn-primary') || modal.querySelector('.episode-btn');
      if (target) window.TV_ENGINE.focusElement(target, false);
    }, 150);
  }
};

function renderEpisodesButtons(anime) {
  const episodes = anime.episodes || [];
  const p = STATE.activeProfile;
  if (!episodes.length) return '<div style="color:var(--text-muted);">No hay capítulos disponibles.</div>';

  return episodes.map(ep => {
    const isWatched = p?.viewedEpisodes?.[`${anime.id}_${ep.number}`];
    return `
      <button class="episode-btn ${isWatched ? 'watched' : ''}" onclick="openPlayer(${anime.id}, ${ep.number})">
        ${isWatched ? '✓ ' : ''}Cap. ${ep.number}
      </button>
    `;
  }).join('');
}

function updateDetailButtons(id) {
  const bar = document.getElementById('detail-actions-bar');
  if (!bar) return;
  const p = STATE.activeProfile;

  const isFav = p?.lists?.favorites?.includes(id);
  const isWatching = p?.lists?.watching?.includes(id);
  const isLater = p?.lists?.watchLater?.includes(id);

  bar.innerHTML = `
    <button class="btn btn-primary" onclick="openPlayer(${id}, 1)">
      <span>▶</span> Ver Cap. 1
    </button>
    <button class="btn btn-secondary" onclick="downloadEpisodeDirect(${id}, 1)">
      <span>📥</span> Descargar MP4
    </button>
    <button class="btn btn-secondary" onclick="toggleUserList('favorites', ${id})">
      <span>${isFav ? '❤️' : '🤍'}</span> ${isFav ? 'Favorito' : '+ Favorito'}
    </button>
    <button class="btn btn-secondary" onclick="toggleUserList('watching', ${id})">
      <span>${isWatching ? '👁️' : '➕'}</span> ${isWatching ? 'Siguiendo' : 'Seguir'}
    </button>
    <button class="btn btn-secondary" onclick="toggleUserList('watchLater', ${id})">
      <span>🕒</span> ${isLater ? 'Guardado' : 'Ver después'}
    </button>
  `;
}

window.toggleUserList = function (listType, animeId) {
  const p = STATE.activeProfile;
  if (!p) return;
  if (!p.lists[listType]) p.lists[listType] = [];

  const idx = p.lists[listType].indexOf(animeId);
  if (idx >= 0) {
    p.lists[listType].splice(idx, 1);
  } else {
    p.lists[listType].push(animeId);
  }

  updateActiveProfileInStorage();
  updateDetailButtons(animeId);
  renderProfileLibrary();
  renderKeepWatching();
  updateUserProfileUI();
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  if (modalId === 'player-modal') {
    if (window.activeHls) {
      try { window.activeHls.destroy(); } catch (e) { }
      window.activeHls = null;
    }
    const wrap = document.getElementById('player-media-wrap');
    if (wrap) wrap.innerHTML = '';
  }
};

window.closePlayer = function () {
  closeModal('player-modal');
};

window.toggleCurrentAnimeFavorite = function () {
  if (STATE.activeAnime) {
    toggleUserList('favorites', STATE.activeAnime.id);
    const isFav = STATE.activeProfile?.lists?.favorites?.includes(STATE.activeAnime.id);
    showToast(isFav ? '❤️ Añadido a favoritos' : '💔 Quitado de favoritos');
  }
};

/* ==========================================================================
   OFFICIAL PLAYER ENGINE (STREAMS DIRECTOS + PUNTOS KAWAII EN TIEMPO REAL)
   ========================================================================== */
window.openPlayer = function (animeId, epNumber) {
  const anime = STATE.animes.find(a => a.id === animeId);
  if (!anime) return;

  STATE.activeAnime = anime;
  STATE.activeEpisode = epNumber;

  const p = STATE.activeProfile;
  if (p) {
    // 1. Mark as watched
    p.viewedEpisodes[`${anime.id}_${epNumber}`] = true;

    // 2. Track last watched chapter
    p.lastWatchedEp[anime.id] = epNumber;

    // 3. Move to front of watching list
    p.lists.watching = [anime.id, ...p.lists.watching.filter(id => id !== anime.id)];

    // 4. PREMIO: +10 PUNTOS KAWAII CADA VEZ QUE SE VE UN CAPÍTULO
    p.points = (p.points || 0) + 10;

    // Guardar en el perfil del usuario activo
    updateActiveProfileInStorage();
    updateUserProfileUI();
    renderKeepWatching();
    renderProfileLibrary();

    showToast(`⭐ +10 KuroHoshi Points ganados por ver este capítulo! (Total: ${p.points} Pts)`);
  }

  const modal = document.getElementById('player-modal');
  const titleEl = document.getElementById('player-anime-name');
  const epEl = document.getElementById('player-ep-name');

  if (titleEl) titleEl.innerText = anime.title;
  if (epEl) epEl.innerHTML = `Capítulo ${epNumber} <span style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; margin-left:8px;">✓ Visto</span>`;

  renderPlayerMedia(anime, epNumber);
  closeModal('detail-modal');
  modal.classList.add('active');

  if (window.TV_ENGINE && document.body.classList.contains('tv-mode')) {
    setTimeout(() => {
      const nextBtn = document.querySelector('#player-modal .btn-primary');
      if (nextBtn) window.TV_ENGINE.focusElement(nextBtn, false);
    }, 200);
  }
};

window.activeHls = null;

function renderPlayerMedia(anime, epNumber) {
  const wrap = document.getElementById('player-media-wrap');
  const serverSelect = document.getElementById('player-server-select');
  const langSelect = document.getElementById('player-lang-select');
  if (!wrap) return;

  if (window.activeHls) {
    try { window.activeHls.destroy(); } catch (e) { }
    window.activeHls = null;
  }

  const ep = anime.episodes?.find(e => e.number === epNumber) || anime.episodes?.[0];
  const allStreams = ep?.streams || [];

  const chosenLang = STATE.currentLanguage || 'sub';
  let availableStreams = allStreams.filter(s => s.lang === chosenLang);
  if (!availableStreams.length) availableStreams = allStreams;

  if (langSelect) {
    langSelect.innerHTML = `
      <option value="sub" ${chosenLang === 'sub' ? 'selected' : ''}>Japonés (Sub)</option>
      <option value="lat" ${chosenLang === 'lat' ? 'selected' : ''}>Español Latino</option>
      <option value="cas" ${chosenLang === 'cas' ? 'selected' : ''}>Castellano</option>
    `;
  }

  let activeStream = availableStreams.find(s => s.server === STATE.currentServer) || availableStreams[0];

  if (serverSelect) {
    serverSelect.innerHTML = availableStreams.map((s, idx) => `
      <option value="${s.server}" ${s.server === (activeStream ? activeStream.server : STATE.currentServer) ? 'selected' : ''}>
        ⚡ ${s.serverName || s.server}
      </option>
    `).join('');
  }

  if (!activeStream || !activeStream.url) {
    wrap.innerHTML = `
      <div style="text-align:center; padding:4rem; color:var(--text-muted);">
        <h3>Capítulo ${epNumber} de ${anime.title}</h3>
        <p style="margin-top:0.5rem;">Cargando servidores de video...</p>
      </div>
    `;
    return;
  }

  const apiServer = getApiServer();
  const streamUrl = activeStream.url;

  // Si no hay servidor de API local/remoto activo (ej: GitHub Pages o sin server.py en ejecución),
  // intentar extraer HLS directo sin anuncios o cargar embed con escudo anti-popups
  if (!apiServer) {
    playDirectOrStealth(wrap, anime, epNumber, streamUrl);
    return;
  }

  // Estado visual de carga y bypass invisible mientras se consulta al backend local
  wrap.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); background:#050508;">
      <div style="font-size:2.2rem; margin-bottom:1rem; animation: pulse 1.5s infinite;">🌸</div>
      <p style="font-weight:600; color:var(--text-main); font-size:1.1rem;">Iniciando reproducción sin anuncios...</p>
      <span style="font-size:0.8rem; color:var(--text-muted); margin-top:0.4rem;">Protección stealth activa (bloqueador invisible)</span>
    </div>
  `;

  fetch(`${apiServer}/api/stream-info?url=${encodeURIComponent(streamUrl)}`, {
    signal: AbortSignal.timeout(3500)
  })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      if (data && data.status === 'ok' && data.mode === 'hls' && window.Hls && Hls.isSupported() && data.url) {
        // Reproductor Nativo HLS (0 anuncios, 0 popups, streaming directo ultra limpio)
        wrap.innerHTML = `
          <video id="native-hls-player" class="player-video" controls autoplay playsinline style="width:100%; height:100%; background:#000;">
            Tu navegador no soporta video HTML5.
          </video>
        `;
        const video = document.getElementById('native-hls-player');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(`${apiServer}${data.url}`);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(() => { });
        });
        hls.on(Hls.Events.ERROR, function (event, errData) {
          if (errData && errData.fatal) {
            console.warn('[KuroHoshi Player] HLS error fatal, cambiando a reproductor directo:', errData);
            try { hls.destroy(); } catch (e) { }
            playDirectOrStealth(wrap, anime, epNumber, streamUrl);
          }
        });
        window.activeHls = hls;
      } else if (data && data.status === 'ok' && data.player) {
        // Reproductor Embed con AdBlock Stealth Invisible del backend
        loadStealthEmbed(wrap, anime, epNumber, `${apiServer}${data.player}`);
      } else {
        // Fallback a extractor directo
        playDirectOrStealth(wrap, anime, epNumber, streamUrl);
      }
    })
    .catch(err => {
      console.warn('[KuroHoshi Player] Backend no disponible o error en stream-info, usando extractor directo:', err);
      playDirectOrStealth(wrap, anime, epNumber, streamUrl);
    });
}

async function tryExtractDirectHls(streamUrl) {
  if (!streamUrl) return null;
  if (streamUrl.includes('.m3u8')) return streamUrl;

  const corsProxies = [
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`
  ];

  for (const getUrl of corsProxies) {
    try {
      const res = await fetch(getUrl(streamUrl), { signal: AbortSignal.timeout(3500) });
      if (!res.ok) continue;
      const html = await res.text();

      // Desempaquetar Dean Edwards Packer (LuluStream, Streamwish, etc.)
      const m = html.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)/);
      if (m) {
        let p = m[1];
        const a = parseInt(m[2], 10);
        let c = parseInt(m[3], 10);
        const k = m[4].split('|');
        const e = (val) => (val < a ? '' : e(parseInt(val / a, 10))) + ((val = val % a) > 35 ? String.fromCharCode(val + 29) : val.toString(36));
        while (c--) {
          if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]);
        }
        const m3u8Match = p.match(/https?:\/\/[^\s'"<>]+\.m3u8[^\s'"<>]*/);
        if (m3u8Match) return m3u8Match[0];
      }

      const mDirect = html.match(/https?:\/\/[^\s'"<>]+\.m3u8[^\s'"<>]*/);
      if (mDirect) return mDirect[0];
    } catch (e) { }
  }
  return null;
}

function playDirectOrStealth(wrap, anime, epNumber, streamUrl) {
  wrap.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); background:#050508;">
      <div style="font-size:2.2rem; margin-bottom:1rem; animation: pulse 1.5s infinite;">🌸</div>
      <p style="font-weight:600; color:var(--text-main); font-size:1.1rem;">Iniciando reproducción sin anuncios...</p>
      <span style="font-size:0.8rem; color:var(--text-muted); margin-top:0.4rem;">Escudo activo: bloqueando ventanas emergentes y redirecciones</span>
    </div>
  `;

  tryExtractDirectHls(streamUrl).then(m3u8Url => {
    if (m3u8Url && window.Hls && Hls.isSupported()) {
      wrap.innerHTML = `
        <video id="native-hls-player" class="player-video" controls autoplay playsinline style="width:100%; height:100%; background:#000;">
          Tu navegador no soporta video HTML5.
        </video>
      `;
      const video = document.getElementById('native-hls-player');
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () { video.play().catch(() => { }); });
      hls.on(Hls.Events.ERROR, function (e, errData) {
        if (errData && errData.fatal) {
          try { hls.destroy(); } catch (e) { }
          loadStealthEmbed(wrap, anime, epNumber, streamUrl);
        }
      });
      window.activeHls = hls;
    } else {
      loadStealthEmbed(wrap, anime, epNumber, streamUrl);
    }
  }).catch(() => {
    loadStealthEmbed(wrap, anime, epNumber, streamUrl);
  });
}

function loadStealthEmbed(wrap, anime, epNumber, srcUrl) {
  wrap.innerHTML = `
    <div class="player-embed-wrapper" style="position:relative; width:100%; height:100%; overflow:hidden;">
      <iframe class="player-iframe"
        src="${srcUrl}"
        title="${anime.title} - Cap ${epNumber}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowfullscreen
        referrerpolicy="no-referrer">
      </iframe>
    </div>
  `;
}

window.changePlayerServer = function (server) {
  STATE.currentServer = server;
  localStorage.setItem('kurohoshi_preferred_server', server);
  if (STATE.activeAnime) renderPlayerMedia(STATE.activeAnime, STATE.activeEpisode);
};

window.changePlayerLanguage = function (lang) {
  STATE.currentLanguage = lang;
  if (STATE.activeAnime) renderPlayerMedia(STATE.activeAnime, STATE.activeEpisode);
};

window.playerNextEp = function () {
  if (!STATE.activeAnime) return;
  openPlayer(STATE.activeAnime.id, STATE.activeEpisode + 1);
};

window.playerPrevEp = function () {
  if (!STATE.activeAnime || STATE.activeEpisode <= 1) return;
  openPlayer(STATE.activeAnime.id, STATE.activeEpisode - 1);
};

window.playerSkipIntro = function () {
  const vid = document.getElementById('native-hls-player') || document.getElementById('local-video-player');
  if (vid) {
    vid.currentTime = Math.min((vid.duration || vid.currentTime + 85), vid.currentTime + 85);
  }
  showToast('⏩ Saltando intro (+85s)');
};

// ── VERIFICACIÓN DE HOSTING ESTÁTICO (GitHub Pages, Vercel, Netlify) ─────
function isStaticHost() {
  const host = (window.location.hostname || '').toLowerCase();
  return host.endsWith('.github.io') ||
    host.endsWith('.netlify.app') ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.pages.dev') ||
    host.endsWith('.gitlab.io') ||
    host.endsWith('.firebaseapp.com') ||
    host.endsWith('.web.app') ||
    window.location.protocol === 'file:';
}

// ── SERVIDOR DE API / STREAMING ──────────────────────────────────────────
function getApiServer() {
  const custom = localStorage.getItem('kurohoshi_server_ip');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  // En hostings estáticos (GitHub Pages, etc.) no existe backend en el mismo dominio
  if (isStaticHost()) {
    return null;
  }
  // En red local o puerto local
  if (window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

window.saveServerIp = function (val) {
  if (val && val.trim()) {
    let clean = val.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    localStorage.setItem('kurohoshi_server_ip', clean);
    showToast(`🌐 Servidor configurado: ${clean}`);
  } else {
    localStorage.removeItem('kurohoshi_server_ip');
    showToast('🌐 Servidor restablecido a automático');
  }
  const input = document.getElementById('setting-server-ip');
  if (input) input.value = localStorage.getItem('kurohoshi_server_ip') || '';
  refreshDownloads();
};

window.downloadCurrentEpisode = function () {
  if (!STATE.activeAnime) return;
  downloadEpisodeDirect(STATE.activeAnime.id, STATE.activeEpisode);
};

window.downloadEpisodeDirect = function (animeId, epNumber = 1) {
  const anime = STATE.animes.find(a => a.id === animeId);
  if (!anime) return;
  const ep = anime.episodes?.find(e => e.number === epNumber) || anime.episodes?.[0];
  const allStreams = ep?.streams || [];
  const chosen = allStreams.find(s => s.server === 'epsilon') || allStreams.find(s => s.server === STATE.currentServer) || allStreams[0];

  if (!chosen || !chosen.url) {
    showToast('❌ Enlace no disponible');
    return;
  }

  startDownload(chosen.url, anime.title, epNumber, anime.id);
};

let _dlPollers = {};

window.startDownload = function (streamUrl, animeTitle, epNumber, animeId) {
  const anime = STATE.animes.find(a => String(a.id) === String(animeId)) || STATE.activeAnime;
  const poster = anime ? (anime.poster || '') : '';
  const SERVER = getApiServer();

  if (!SERVER) {
    const fallback = streamUrl.replace('/e/', '/d/');
    window.open(fallback, '_blank', 'noopener,noreferrer');
    showToast(`📥 Abriendo enlace de descarga: ${animeTitle} Ep. ${epNumber}`);
    return;
  }

  const params = new URLSearchParams({
    url: streamUrl,
    title: animeTitle,
    ep: epNumber,
    animeId: animeId,
    poster: poster
  });

  showToast(`⏳ Descargando: ${animeTitle} Ep. ${epNumber}…`);

  fetch(`${SERVER}/api/descargar?${params}`, { signal: AbortSignal.timeout(4000) })
    .then(r => {
      if (!r.ok) throw new Error('Servidor no disponible');
      return r.json();
    })
    .then(data => {
      if (data.status === 'ya_descargado') {
        showToast(`✅ Ya estaba descargado: ${animeTitle} Ep. ${epNumber}`);
        refreshDownloads();
        return;
      }
      if (data.status === 'ya_descargando') {
        showToast('⏳ Ya se está descargando este episodio…');
        return;
      }
      if (data.key) {
        showToast(`📥 Descarga iniciada: ${animeTitle} Ep. ${epNumber}`);
        const key = data.key;
        if (_dlPollers[key]) clearInterval(_dlPollers[key]);
        _dlPollers[key] = setInterval(() => pollDownload(key, animeTitle, epNumber), 2000);
        refreshDownloads();
      }
    })
    .catch(() => {
      const fallback = streamUrl.replace('/e/', '/d/');
      window.open(fallback, '_blank', 'noopener,noreferrer');
    });
};

function pollDownload(key, title, ep) {
  const srv = getApiServer();
  if (!srv) {
    clearInterval(_dlPollers[key]);
    delete _dlPollers[key];
    return;
  }
  fetch(`${srv}/api/progreso?key=${encodeURIComponent(key)}`)
    .then(r => r.json())
    .then(data => {
      if (data.status === 'completo') {
        clearInterval(_dlPollers[key]);
        delete _dlPollers[key];
        showToast(`✅ Descarga lista: ${title} Ep. ${ep} (${data.sizeMB} MB)`);
        refreshDownloads();
      } else if (data.status === 'error') {
        clearInterval(_dlPollers[key]);
        delete _dlPollers[key];
        showToast(`❌ Error al descargar: ${data.error}`);
        refreshDownloads();
      } else {
        updateActiveDownloadProgress(key, data.progress || 0);
      }
    })
    .catch(() => {
      clearInterval(_dlPollers[key]);
      delete _dlPollers[key];
    });
}

function updateActiveDownloadProgress(key, pct) {
  const fill = document.getElementById(`dl-fill-${key}`);
  const label = document.getElementById(`dl-pct-${key}`);
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.innerText = `${pct}%`;
}

// ── VISTA DE DESCARGAS & REPRODUCTOR LOCAL ────────────────────────────────
STATE.downloadedList = [];

window.refreshDownloads = function () {
  const grid = document.getElementById('downloads-grid');
  if (!grid) return;

  const server = getApiServer();
  if (!server) {
    renderOfflineDownloadsMessage(grid);
    return;
  }

  fetch(`${server}/api/downloads`, { signal: AbortSignal.timeout(3500) })
    .then(r => {
      if (!r.ok) throw new Error('Offline');
      return r.json();
    })
    .then(list => {
      STATE.downloadedList = list || [];
      localStorage.setItem('kurohoshi_cached_downloads', JSON.stringify(STATE.downloadedList));
      renderDownloadsList(STATE.downloadedList);
    })
    .catch(() => {
      renderOfflineDownloadsMessage(grid);
    });
};

function renderOfflineDownloadsMessage(grid) {
  const cached = localStorage.getItem('kurohoshi_cached_downloads');
  if (cached) {
    try {
      const list = JSON.parse(cached);
      if (list && list.length > 0) {
        STATE.downloadedList = list;
        renderDownloadsList(list);
        return;
      }
    } catch (e) { }
  }

  const currentIp = localStorage.getItem('kurohoshi_server_ip') || '';
  grid.innerHTML = `
    <div style="grid-column: 1 / -1; background:#14141c; border:1px solid var(--border-light); border-radius:10px; padding:2rem; text-align:center; max-width:560px; margin:2rem auto; box-shadow:0 8px 30px rgba(0,0,0,0.5);">
      <div style="font-size:2.4rem; margin-bottom:0.75rem;">📶 🎬</div>
      <h2 style="font-size:1.15rem; margin-bottom:0.5rem; color:#fff;">Tus Descargas Offline</h2>
      <p style="color:var(--text-muted); font-size:0.86rem; line-height:1.6; margin-bottom:1.25rem;">
        En tu <strong>PC</strong>, las descargas se guardan directamente al reproducir o descargar ejecutando el servidor local.
        <br>
        En tu <strong>Teléfono / APK o Web</strong>, para sincronizar tus animes descargados conéctate al mismo Wi-Fi de tu PC e introduce la IP de tu servidor abajo:
      </p>
      <div style="display:flex; gap:0.5rem; justify-content:center; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">
        <input type="text" id="dl-config-ip" value="${currentIp}" placeholder="Ej: http://192.168.1.15:3000" style="background:#1d1d28; border:1px solid var(--border-light); color:#fff; padding:0.55rem 0.85rem; border-radius:6px; font-size:0.85rem; width:230px;">
        <button class="btn btn-primary" onclick="saveServerIp(document.getElementById('dl-config-ip').value)">Conectar</button>
      </div>
      <div style="font-size:0.78rem; color:var(--text-dim);">
        💡 Los animes que descargues estarán disponibles 100% sin internet.
      </div>
    </div>
  `;
}

function renderDownloadsList(list) {
  const grid = document.getElementById('downloads-grid');
  const activeWrap = document.getElementById('downloads-active-wrap');
  if (!grid) return;

  const completed = (list || []).filter(e => e.downloaded && e.status !== 'descargando');
  const active = (list || []).filter(e => e.downloading || e.status === 'descargando');

  const totalMB = completed.reduce((sum, e) => sum + (e.sizeMB || 0), 0);
  const info = document.getElementById('dl-storage-info');
  if (info) {
    info.innerText = `${completed.length} episodios instalados · ${totalMB.toFixed(0)} MB usados`;
  }

  // 1. Mostrar descargas activas en curso
  if (activeWrap) {
    if (active.length > 0) {
      activeWrap.innerHTML = `
        <h3 style="font-size:0.95rem; margin-bottom:0.75rem; color:var(--primary); display:flex; align-items:center; gap:0.5rem;">
          <span>⏳ Descargando actualmente</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">(${active.length})</span>
        </h3>
        ${active.map(item => `
          <div class="dl-active-card" id="dl-card-${item.key}">
            <div class="dl-active-header">
              <span>Descargando: <strong>${item.animeTitle}</strong> — Cap. ${item.episode}</span>
              <span class="dl-active-pct" id="dl-pct-${item.key}">${item.progress || 0}%</span>
            </div>
            <div class="dl-active-bar-wrap">
              <div class="dl-active-bar-fill" id="dl-fill-${item.key}" style="width: ${item.progress || 0}%;"></div>
            </div>
          </div>
        `).join('')}
      `;
    } else {
      activeWrap.innerHTML = '';
    }
  }

  // 2. Si no hay descargas
  if (completed.length === 0 && active.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; padding:4rem 1rem; color:var(--text-muted); text-align:center;">
        <div style="font-size:3rem; margin-bottom:1rem;">💾</div>
        <h3>No tienes episodios descargados aún</h3>
        <p style="margin-top:0.5rem; font-size:0.9rem;">Haz clic en <strong>📥 Descargar MP4</strong> en cualquier anime para verlo offline sin anuncios y con imagen fluida.</p>
      </div>
    `;
    return;
  }

  // 3. Agrupar episodios por Anime mostrando Portadas como en Inicio
  const animeGroups = {};
  completed.forEach(item => {
    const animeId = item.animeId || item.animeTitle;
    if (!animeGroups[animeId]) {
      const foundAnime = STATE.animes.find(a => String(a.id) === String(item.animeId)) ||
        STATE.animes.find(a => a.title.toLowerCase() === item.animeTitle.toLowerCase());
      animeGroups[animeId] = {
        id: item.animeId || animeId,
        title: foundAnime ? foundAnime.title : item.animeTitle,
        poster: foundAnime ? foundAnime.poster : (item.poster || 'assets/no_image_vertical.webp'),
        banner: foundAnime ? (foundAnime.banner || foundAnime.poster) : 'assets/no_image_horizontal.webp',
        synopsis: foundAnime ? foundAnime.synopsis : 'Episodios descargados para reproducir offline.',
        score: foundAnime ? foundAnime.score : '9.0',
        episodes: []
      };
    }
    animeGroups[animeId].episodes.push(item);
  });

  // Ordenar episodios dentro de cada grupo
  Object.values(animeGroups).forEach(grp => {
    grp.episodes.sort((a, b) => (Number(a.episode) || 0) - (Number(b.episode) || 0));
  });

  // Renderizar las tarjetas en la cuadrícula idénticas a Inicio
  grid.innerHTML = Object.values(animeGroups).map(grp => {
    const count = grp.episodes.length;
    const animeMB = grp.episodes.reduce((s, e) => s + (e.sizeMB || 0), 0);
    return `
      <div class="v-card" onclick="openDownloadedAnimeModal('${grp.id}')" title="Ver capítulos instalados de ${grp.title}" style="cursor:pointer;">
        <div class="v-card-poster-wrap shimmer-loading">
          <img src="${grp.poster}" alt="${grp.title}" class="v-card-poster"
            onload="this.parentElement.classList.remove('shimmer-loading')"
            onerror="this.parentElement.classList.remove('shimmer-loading'); this.src='assets/no_image_vertical.webp'">
          <span class="v-card-tv-badge" style="border-color:#10b981; color:#10b981; background:rgba(0,0,0,0.85); font-weight:700;">
            💾 ${count} Cap${count > 1 ? 's' : ''}
          </span>
        </div>
        <div class="v-card-title">${grp.title}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
          ${animeMB.toFixed(0)} MB · Offline
        </div>
      </div>
    `;
  }).join('');
}

window.openDownloadedAnimeModal = function (animeId) {
  const modal = document.getElementById('downloaded-modal');
  const body = document.getElementById('downloaded-modal-body');
  if (!modal || !body) return;

  const completed = (STATE.downloadedList || []).filter(e => e.downloaded);
  const eps = completed.filter(e => String(e.animeId) === String(animeId) || e.animeTitle.toLowerCase() === animeId.toLowerCase());

  if (!eps.length) {
    showToast('No se encontraron episodios descargados para este anime.');
    return;
  }

  const foundAnime = STATE.animes.find(a => String(a.id) === String(animeId)) ||
    STATE.animes.find(a => a.title.toLowerCase() === eps[0].animeTitle.toLowerCase());

  const title = foundAnime ? foundAnime.title : eps[0].animeTitle;
  const poster = foundAnime ? foundAnime.poster : (eps[0].poster || 'assets/no_image_vertical.webp');
  const banner = foundAnime ? (foundAnime.banner || foundAnime.poster) : 'assets/no_image_horizontal.webp';
  const synopsis = foundAnime ? foundAnime.synopsis : 'Episodios descargados listos para reproducir offline en calidad original sin anuncios.';
  const score = foundAnime ? foundAnime.score : '9.0';

  eps.sort((a, b) => (Number(a.episode) || 0) - (Number(b.episode) || 0));

  body.innerHTML = `
    <div class="detail-header">
      <img class="detail-backdrop" src="${banner}" alt="${title}" onerror="this.src='assets/no_image_horizontal.webp'">
      <div class="detail-gradient"></div>
    </div>
    <div class="detail-body">
      <div class="detail-poster-wrap">
        <img class="detail-poster" src="${poster}" alt="${title}" onerror="this.src='assets/no_image_vertical.webp'">
      </div>
      <div class="detail-info" style="flex:1;">
        <h2 class="detail-title">${title}</h2>
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap;">
          <span style="color:var(--accent-gold); font-weight:700;">★ ${score}</span>
          <span>·</span>
          <span style="background:rgba(16,185,129,0.18); color:#10b981; border:1px solid #10b981; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">
            💾 ${eps.length} Capítulos Instalados
          </span>
        </div>
        <p style="font-size:0.88rem; color:#ccc; line-height:1.5; margin-bottom:1rem; max-height:90px; overflow-y:auto;">
          ${synopsis}
        </p>
      </div>
    </div>

    <!-- Lista exclusiva de capítulos instalados -->
    <div style="margin-top:1.5rem;">
      <h3 style="margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
        <span>🎞️ Capítulos Instalados (${eps.length} disponibles)</span>
        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">Solo episodios disponibles offline</span>
      </h3>
      <div class="downloaded-eps-grid">
        ${eps.map(ep => `
          <div class="dl-ep-card">
            <div class="dl-ep-title-row">
              <span class="dl-ep-badge">✓ Instalado</span>
              <strong>Capítulo ${ep.episode}</strong>
              <span class="dl-ep-size">(${ep.sizeMB || '0'} MB · H.264)</span>
            </div>
            <div class="dl-ep-actions">
              <button class="btn btn-primary" style="padding:0.4rem 0.9rem; font-size:0.8rem;" onclick="closeModal('downloaded-modal'); playLocalEpisode('descargas/${encodeURIComponent(ep.filename)}', '${title} - Cap ${ep.episode}')">
                ▶ Ver Capítulo
              </button>
              <button class="btn btn-secondary" style="padding:0.4rem 0.7rem; font-size:0.8rem;" onclick="deleteDownload('${ep.key}', '${animeId}')" title="Eliminar este episodio">
                🗑️
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.add('active');
};

window.playLocalEpisode = function (filePath, title) {
  const modal = document.getElementById('local-player-modal');
  const video = document.getElementById('local-video-player');
  const titleEl = document.getElementById('local-player-title');
  const url = `${getApiServer()}/${filePath}`;

  if (video) {
    video.pause();
    video.src = url;
    video.load();
    video.play().catch(e => console.warn('[KuroHoshi Local Player] Play error:', e));
  }
  if (titleEl) titleEl.innerText = title;
  if (modal) modal.classList.add('active');
};

window.closeLocalPlayer = function () {
  const modal = document.getElementById('local-player-modal');
  const video = document.getElementById('local-video-player');
  if (video) { video.pause(); video.src = ''; }
  if (modal) modal.classList.remove('active');
};

window.deleteDownload = function (key, currentModalAnimeId) {
  if (!confirm('¿Eliminar este episodio descargado?')) return;
  fetch(`${getApiServer()}/api/borrar?key=${encodeURIComponent(key)}`)
    .then(r => r.json())
    .then(() => {
      showToast('🗑️ Episodio eliminado');
      refreshDownloads();
      if (currentModalAnimeId) {
        setTimeout(() => {
          fetch(`${getApiServer()}/api/downloads`)
            .then(r => r.json())
            .then(list => {
              STATE.downloadedList = list || [];
              const remaining = (list || []).filter(e => e.downloaded && (String(e.animeId) === String(currentModalAnimeId) || e.animeTitle.toLowerCase() === currentModalAnimeId.toLowerCase()));
              if (remaining.length > 0) {
                openDownloadedAnimeModal(currentModalAnimeId);
              } else {
                closeModal('downloaded-modal');
              }
            });
        }, 300);
      }
    });
};

/* ==========================================================================
   CONFIGURACIÓN (AJUSTES) & CACHÉ
   ========================================================================= */
window.saveAppSetting = function (key, val) {
  if (!STATE.activeProfile) return;
  STATE.activeProfile.settings[key] = val;
  updateActiveProfileInStorage();
  showToast('✓ Ajuste guardado');
};

window.clearEpCache = function () {
  showToast('🧹 Caché de episodios limpiada (0 KB)');
  const el = document.getElementById('cache-ep-desc');
  if (el) el.innerText = '0 KB usados / 240 MB';
};

window.clearImgCache = function () {
  showToast('🧹 Caché de imágenes limpiada');
  const el = document.getElementById('cache-img-desc');
  if (el) el.innerText = '0 KB usados / 60 MB';
};

window.refreshCatalogBanner = function () {
  reloadWithRowAnimation();
};

/* ==========================================================================
   PROTECCIÓN, TECLAS & PANTALLA COMPLETA APK/MÓVIL
   ========================================================================== */
function initAppProtectionAndShortcuts() {
  // 1. Deshabilitar menú contextual (clic derecho) para evitar inspeccionar
  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. Control de atajos de teclado: F5 recarga animada, bloqueo de DevTools
  window.addEventListener('keydown', function (e) {
    // F5 o Ctrl+R: Recargar la vista con animación de hileras
    if (e.key === 'F5' || e.keyCode === 116 || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
      e.preventDefault();
      e.stopPropagation();
      reloadWithRowAnimation();
      return false;
    }

    // Bloquear F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (Ver código fuente), Ctrl+S
    if (
      e.key === 'F12' ||
      e.keyCode === 123 ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && ['u', 'U', 's', 'S'].includes(e.key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 3. Ocultar barra de búsqueda/navegación al abrir en móviles o APK
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.scrollTo(0, 1);
    const triggerFullscreen = () => {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs && !document.fullscreenElement) {
        rfs.call(el).catch(() => { });
      }
    };
    document.addEventListener('touchstart', triggerFullscreen, { once: true });
    document.addEventListener('click', triggerFullscreen, { once: true });
  }
}

/* ==========================================================================
   RECARGA CON ANIMACIÓN DE HILERAS (F5 & Botón Actualizar)
   ========================================================================== */
window.reloadWithRowAnimation = function () {
  const currentHash = window.location.hash || '#inicio';

  if (currentHash === '' || currentHash === '#inicio') {
    showToast('🔄 Recargando catálogo y contenido...');

    // Girar el icono de actualización del banner
    const bannerIcon = document.querySelector('.top-banner-icon svg');
    if (bannerIcon) {
      bannerIcon.style.transition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
      bannerIcon.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        bannerIcon.style.transition = 'none';
        bannerIcon.style.transform = '';
      }, 700);
    }

    // Re-renderizar carruseles
    initHomeCarousels();

    // Animación hilera por hilera: Hero, Seguir viendo, Recientes, Porque viste, Latinos, Populares
    const rows = Array.from(document.querySelectorAll('#view-inicio .hero-slider, #view-inicio .carousel-container'));

    rows.forEach((row, rIdx) => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(26px)';
      row.style.transition = 'none';

      setTimeout(() => {
        row.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';

        // Animar las tarjetas dentro de cada hilera con efecto onda
        const cards = Array.from(row.querySelectorAll('.v-card, .h-card'));
        cards.forEach((card, cIdx) => {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.92) translateY(8px)';
          card.style.transition = 'none';

          setTimeout(() => {
            card.style.transition = 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
          }, cIdx * 25);
        });
      }, rIdx * 150);
    });
  } else {
    // Si está en otra pestaña (explorar, buscar, etc.)
    showToast('🔄 Actualizando vista actual...');
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection) {
      activeSection.style.opacity = '0';
      activeSection.style.transform = 'translateY(16px)';
      setTimeout(() => {
        activeSection.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        activeSection.style.opacity = '1';
        activeSection.style.transform = 'translateY(0)';
      }, 150);
    }
  }
};

/* ==========================================================================
   REDES SOCIALES
   ========================================================================== */
window.openSocialModal = function () {
  const modal = document.getElementById('social-modal');
  if (modal) modal.classList.add('active');
};

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('kurohoshi-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'kurohoshi-toast';
    toast.className = 'kurohoshi-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/* ==========================================================================
   SAKURA PETALS EFFECT
   ========================================================================== */
function initSakuraPetals() {
  const canvas = document.getElementById('sakura-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const TOTAL = 20;

  for (let i = 0; i < TOTAL; i++) {
    petals.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 7 + 5,
      speedX: Math.random() * 1.2 - 0.4,
      speedY: Math.random() * 1.0 + 0.6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.35 + 0.25
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      if (p.y > height + 20) { p.y = -20; p.x = Math.random() * width; }
      if (p.x > width + 20) p.x = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = `rgba(255, 107, 157, ${p.opacity})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  draw();
}


/* ==========================================================================
   REDES SOCIALES — PRÓXIMAMENTE
   ========================================================================== */
window.showComingSoon = function (el) {
  // Efecto visual en la tarjeta clickeada
  el.classList.add('social-coming-pulse');
  setTimeout(() => el.classList.remove('social-coming-pulse'), 600);
  showToast('🕐 ¡Próximamente disponible!');
};

/* ==========================================================================
   ANIMACIÓN DE ENTRADA — INICIO (KuroHoshi Cascading Entrance)
   ========================================================================== */
let _hasRunEntrance = false;

function initEntranceAnimation() {
  // Pre-ocultar suavemente los elementos de la barra lateral si el modal de perfil está activo
  const netflixScreen = document.getElementById('netflix-screen');
  if (netflixScreen && netflixScreen.classList.contains('active')) {
    const sidebarElements = document.querySelectorAll('.sidebar-logo, .sidebar-logo-sub, .sidebar-item');
    sidebarElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-20px)';
    });
  }
}

function runEntranceAnimation() {
  _hasRunEntrance = true;

  // 1. Elementos de la barra lateral uno por uno: Logo -> Inicio -> Buscar -> Explorar...
  const logo = document.querySelector('.sidebar-logo');
  const logoSub = document.querySelector('.sidebar-logo-sub');
  const navItems = Array.from(document.querySelectorAll('.sidebar-nav .sidebar-item'));
  const sidebarSequence = [logo, logoSub, ...navItems].filter(Boolean);

  sidebarSequence.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-22px)';
    el.style.transition = 'none';

    setTimeout(() => {
      el.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    }, 80 + i * 50);
  });

  // 2. Banner superior rojo de KuroHoshi
  const topBanner = document.querySelector('.kurohoshi-top-banner, .kawaii-top-banner');
  if (topBanner) {
    topBanner.style.opacity = '0';
    topBanner.style.transform = 'translateY(-14px)';
    topBanner.style.transition = 'none';
    setTimeout(() => {
      topBanner.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      topBanner.style.opacity = '1';
      topBanner.style.transform = 'translateY(0)';
    }, 600);
  }

  // 3. Hero Carousel (Destacados)
  const hero = document.getElementById('hero-slider');
  if (hero) {
    hero.style.opacity = '0';
    hero.style.transform = 'scale(0.97) translateY(12px)';
    hero.style.transition = 'none';
    setTimeout(() => {
      hero.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      hero.style.opacity = '1';
      hero.style.transform = 'scale(1) translateY(0)';
    }, 720);
  }

  // 4. Secciones de carrusel (Seguir Viendo, Recientes, Porque viste, Latinos, Populares)
  const carousels = Array.from(document.querySelectorAll('#view-inicio .carousel-container'));
  carousels.forEach((sec, sIdx) => {
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(24px)';
    sec.style.transition = 'none';

    setTimeout(() => {
      sec.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      sec.style.opacity = '1';
      sec.style.transform = 'translateY(0)';
    }, 850 + sIdx * 120);
  });

  // 5. Portadas y tarjetas de anime una por una
  setTimeout(() => {
    const cards = Array.from(document.querySelectorAll('#view-inicio .carousel-track .v-card, #view-inicio .carousel-track .h-card'));
    cards.forEach((card, cIdx) => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.92) translateY(10px)';
      card.style.transition = 'none';

      setTimeout(() => {
        card.style.transition = 'opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1) translateY(0)';
      }, cIdx * 28);
    });
  }, 1100);
}
