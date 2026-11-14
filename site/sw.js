/**
 * KUROHOSHI — Service Worker & Offline Cache Engine
 * 1. Cache First para funcionamiento 100% offline (PWA / APK).
 * 2. Bloqueador de anuncios y ventanas emergentes sigiloso.
 */

const CACHE_NAME = 'kurohoshi-cache-v7';

// Archivos esenciales para funcionamiento sin internet
const STATIC_APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './gamepad.js',
  './hls.min.js',
  './manifest.json',
  './animes.json',
  './assets/kh_snombre.png',
  './assets/kh.png',
  './assets/splash_robot.webp',
  './assets/no_image_horizontal.webp',
  './assets/no_image_vertical.webp',
  './assets/profile_frame_basic_sakura.webp'
];

// Dominios de publicidad conocidos
const AD_DOMAINS = [
  'crittereasilyhangover.com',
  'nonenulaging.com',
  'dv5vwlgir0hsc.cloudfront.net',
  'megacloud.tv',
  'adservice.google.com',
  'googleads.g.doubleclick.net',
  'tpc.googlesyndication.com',
  'pagead2.googlesyndication.com',
  'securepubads.g.doubleclick.net',
  'fundingchoicesmessages.google.com',
  'adsafeprotected.com',
  'amazon-adsystem.com',
  'ads.pubmatic.com',
  'bidswitch.net',
  'rubiconproject.com',
  'openx.net',
  'advertising.com',
  'moatads.com',
  'outbrain.com',
  'taboola.com',
  'adnxs.com',
  'exoclick.com',
  'trafficjunky.com',
  'juicyads.com',
  'popcash.net',
  'popads.net',
  'popmyads.com',
  'traffic-media.co',
  'coinzillatag.com',
  'coinad.media',
  'coinadz.net',
  'ero-advertising.com',
  'propu.sh',
  'onesignal.com',
  'pushcrew.com',
  'subscribers.com',
  'smartadserver.com',
  'andfel.click',
  'andfel.net'
];

const AD_PATH_PATTERNS = [
  '/js/pop.js',
  '/js/dnsads.js',
  'pop.js',
  'popunder',
  'onclick.js',
  'onclick=',
  '/on.js',
  'andfel'
];

const EMPTY_JS = new Response(`
  window.canRunAds = true;
  window.isAdBlockActive = false;
  window.__adbDetected = false;
  window.adblock = false;
  window.adBlockDetected = false;
  window.hasAdBlock = false;
  window.isAdblock = false;
  window.justDetectAdblock = {
    detectAnyAdblocker: function() { return Promise.resolve(false); },
    detectBait: function() { return Promise.resolve(false); }
  };
  window.showADBOverlay = function() {};
  window.showGuardOverlay = function() {};
  window.checkADB = function() { return false; };
  window.FuckAdBlock = function() {
    this.on = function() { return this; };
    this.onDetected = function() { return this; };
    this.onNotDetected = function(fn) { if (typeof fn === 'function') setTimeout(fn, 1); return this; };
    this.check = function() { return false; };
  };
  window.fuckAdBlock = new window.FuckAdBlock();
  window.BlockAdBlock = window.FuckAdBlock;
  window.blockAdBlock = window.fuckAdBlock;
`, {
  status: 200,
  headers: { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*' }
});

const EMPTY_HTML = new Response('', {
  status: 200,
  headers: { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' }
});

const EMPTY_GIF = new Response(
  Uint8Array.from([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 255, 255, 255, 0, 0, 0, 33, 249, 4, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]).buffer,
  { status: 200, headers: { 'Content-Type': 'image/gif', 'Access-Control-Allow-Origin': '*' } }
);

function shouldBlock(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase() + u.search.toLowerCase();
    if (AD_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) return true;
    if (AD_PATH_PATTERNS.some(p => path.includes(p))) return true;
  } catch (e) { }
  return false;
}

function fakeResponse(url) {
  const u = url.toLowerCase();
  if (u.endsWith('.gif') || u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.webp')) return EMPTY_GIF.clone();
  if (u.endsWith('.html') || u.endsWith('/')) return EMPTY_HTML.clone();
  return EMPTY_JS.clone();
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_APP_SHELL).catch((err) => {
        console.warn('Pre-cache warning (normal si se carga offline):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // 1. Bloquear anuncios
  if (shouldBlock(url)) {
    e.respondWith(fakeResponse(url));
    return;
  }

  // 2. Si es una llamada a la API del servidor (descargas, streaming proxy), pasar directo
  if (url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{"error":"offline"}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // 3. Estrategia de caché para la app: Network First con fallback a Cache (Offline)
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Sin conexión: responder desde la caché local
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.destination === 'document') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 404 });
        });
      })
  );
});
