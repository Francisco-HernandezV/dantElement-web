const VERSION = "v1";
const CACHE_SHELL = `shell-${VERSION}`;
const CACHE_RUNTIME = `runtime-${VERSION}`;
const CACHE_API = `api-catalogo-${VERSION}`;
const CACHE_IMAGES = `imagenes-${VERSION}`;
const CACHE_FONTS_CSS = `google-fonts-css-${VERSION}`;
const CACHE_FONTS_FILES = `google-fonts-files-${VERSION}`;
const CACHES_ACTUALES = [
  CACHE_SHELL,
  CACHE_RUNTIME,
  CACHE_API,
  CACHE_IMAGES,
  CACHE_FONTS_CSS,
  CACHE_FONTS_FILES,
];
const API_ORIGIN = "https://modulo-usuarios-docker.onrender.com";
const API_PUBLICA_REGEX =
  /^\/api\/admin\/(productos(\/[^/]+\/detalle)?|configuracion)\/?$/;
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/vite.svg",
  "/icons/icon.svg",
  "/icons/apple-touch-icon-180x180.png",
  "/icons/pwa-192x192.png",
  "/icons/pwa-512x512.png",
  "/icons/maskable-icon-512x512.png",
];

async function descubrirBundlePrincipal() {
  try {
    const html = await (await fetch("/index.html")).text();
    const urls = new Set();
    for (const match of html.matchAll(/\s(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)) {
      urls.add(match[1]);
    }
    return [...urls];
  } catch (err) {
    console.warn("[sw] No se pudo leer index.html para precachear el bundle principal:", err);
    return [];
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const bundlePrincipal = await descubrirBundlePrincipal();
      const cache = await caches.open(CACHE_SHELL);
      await Promise.all(
        [...APP_SHELL, ...bundlePrincipal].map((url) =>
          cache.add(url).catch((err) => console.warn(`[sw] No se pudo precachear ${url}:`, err))
        )
      );
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => !CACHES_ACTUALES.includes(nombre))
            .map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function redPrimero(request, cacheName, { timeoutMs = 5000, cacheableStatuses = [200] } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const respuestaRed = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    if (cacheableStatuses.includes(respuestaRed.status)) {
      cache.put(request, respuestaRed.clone());
    }
    return respuestaRed;
  } catch {
    const cacheada = await cache.match(request);
    if (cacheada) return cacheada;
    throw new Error("Sin red y sin caché para " + request.url);
  }
}
async function cacheYRevalida(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cacheada = await cache.match(request);
  const actualizacion = fetch(request)
    .then((respuestaRed) => {
      if (respuestaRed.ok || respuestaRed.type === "opaque") {
        cache.put(request, respuestaRed.clone());
      }
      return respuestaRed;
    })
    .catch(() => null);
  return cacheada || (await actualizacion) || Response.error();
}

async function cachePrimero(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cacheada = await cache.match(request);
  if (cacheada) return cacheada;
  const respuestaRed = await fetch(request);
  if (respuestaRed.ok || respuestaRed.type === "opaque") {
    cache.put(request, respuestaRed.clone());
  }
  return respuestaRed;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(
      redPrimero(request, CACHE_SHELL, { timeoutMs: 5000 }).catch(
        async () => (await caches.match("/index.html")) || Response.error()
      )
    );
    return;
  }
  if (
    url.origin === API_ORIGIN &&
    API_PUBLICA_REGEX.test(url.pathname) &&
    !request.headers.has("Authorization")
  ) {
    event.respondWith(redPrimero(request, CACHE_API, { timeoutMs: 5000 }));
    return;
  }
  if (url.origin === API_ORIGIN) return;
  if (
    request.destination === "image" &&
    (url.origin === self.location.origin ||
      url.hostname === "res.cloudinary.com" ||
      url.hostname === "images.unsplash.com")
  ) {
    event.respondWith(cacheYRevalida(request, CACHE_IMAGES));
    return;
  }
  if (url.origin === "https://fonts.googleapis.com") {
    event.respondWith(cacheYRevalida(request, CACHE_FONTS_CSS));
    return;
  }
  if (url.origin === "https://fonts.gstatic.com") {
    event.respondWith(cachePrimero(request, CACHE_FONTS_FILES));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cachePrimero(request, CACHE_RUNTIME));
  }
});
