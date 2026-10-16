// Service Worker de DanElement Boutique — escrito a mano (sin Workbox).
//
// Vite coloca este archivo tal cual en la raíz del build (dist/sw.js) porque
// vive en public/. Se registra desde UpdateToast.jsx al cargar la app.
//
// Estrategia general:
//   1) install  -> precachea el "app shell" (HTML, manifest, iconos: archivos
//                  con nombre fijo que no cambian de hash entre builds).
//   2) activate -> borra cachés de versiones anteriores.
//   3) fetch    -> una estrategia distinta según el tipo de petición:
//        - Navegación (cargar una página/ruta del SPA): red primero, con
//          tiempo límite; si falla, sirve el index.html cacheado para que
//          React Router pinte la ruta offline.
//        - Bundles de JS/CSS propios (hash distinto en cada build): se
//          cachean "sobre la marcha" la primera vez que se piden online, y
//          se sirven desde caché si no hay red.
//        - API pública del catálogo/configuración (sin JWT): red primero,
//          con una caché de respaldo para offline. Nunca se cachea si la
//          petición trae un header Authorization (sería una respuesta
//          potencialmente personalizada).
//        - Imágenes de producto (propias, Cloudinary, Unsplash): se sirve lo
//          cacheado de inmediato y, en paralelo, se actualiza la caché con la
//          versión de red más reciente (stale-while-revalidate).
//        - Fuentes de Google: la hoja de estilos se revalida en segundo
//          plano; los archivos de fuente (.woff2) casi no cambian, así que
//          se sirven directo de caché si ya existen.

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

// Único origen desde el que la app pide datos (ver services/api.js).
const API_ORIGIN = "https://modulo-usuarios-docker.onrender.com";
// Mismas rutas públicas que services/api.js excluye de enviar el token.
const API_PUBLICA_REGEX =
  /^\/api\/admin\/(productos(\/[^/]+\/detalle)?|configuracion)\/?$/;

// Archivos de nombre fijo (no llevan hash de build): se pueden listar a mano.
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

// El bundle principal (index-<hash>.js, su CSS y el vendor de React) tiene
// nombre distinto en cada build, así que no se puede escribir a mano como el
// resto del APP_SHELL. En vez de eso, leemos el index.html real servido por
// el propio sitio y sacamos de ahí los <script src> y <link rel=stylesheet>
// que referencia, para precachearlos junto con el resto del shell.
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
      // Si algún archivo falla (p. ej. en un entorno de pruebas), no
      // queremos que todo el install truene: se cachean uno por uno.
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

// El toast de actualización (UpdateToast.jsx) manda este mensaje cuando el
// usuario confirma "Actualizar", para que el SW en espera tome el control.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Red con límite de tiempo; si tarda o falla, usa lo que haya en caché.
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

// Sirve de caché al instante y, en paralelo, refresca la caché con la red.
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

// Caché primero; si no existe, va a la red y la guarda para la próxima vez.
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

  // Solo interceptamos GET: cualquier mutación (POST/PUT/DELETE) va directo
  // a la red, igual que login/ventas/admin (nunca deben cachearse).
  if (request.method !== "GET") return;

  // 1) Navegación entre rutas del SPA (clic en un link, refrescar, escribir
  //    una URL). Red primero; si no hay conexión, cae al index.html cacheado
  //    y React Router pinta la ruta con los datos que sí estén en caché.
  if (request.mode === "navigate") {
    event.respondWith(
      redPrimero(request, CACHE_SHELL, { timeoutMs: 5000 }).catch(
        async () => (await caches.match("/index.html")) || Response.error()
      )
    );
    return;
  }

  // 2) API pública del catálogo/configuración (sin JWT, ver adminRoutes.js
  //    y services/api.js). Nunca se cachea si la petición lleva Authorization,
  //    porque eso significaría una respuesta potencialmente distinta por
  //    usuario, y queremos una sola copia pública y compartible en caché.
  if (
    url.origin === API_ORIGIN &&
    API_PUBLICA_REGEX.test(url.pathname) &&
    !request.headers.has("Authorization")
  ) {
    event.respondWith(redPrimero(request, CACHE_API, { timeoutMs: 5000 }));
    return;
  }
  if (url.origin === API_ORIGIN) return; // resto de la API: siempre a la red

  // 3) Imágenes de producto: propias, Cloudinary o Unsplash.
  if (
    request.destination === "image" &&
    (url.origin === self.location.origin ||
      url.hostname === "res.cloudinary.com" ||
      url.hostname === "images.unsplash.com")
  ) {
    event.respondWith(cacheYRevalida(request, CACHE_IMAGES));
    return;
  }

  // 4) Google Fonts: la hoja de estilos se revalida en segundo plano, los
  //    archivos de fuente se sirven de caché tal cual (casi nunca cambian).
  if (url.origin === "https://fonts.googleapis.com") {
    event.respondWith(cacheYRevalida(request, CACHE_FONTS_CSS));
    return;
  }
  if (url.origin === "https://fonts.gstatic.com") {
    event.respondWith(cachePrimero(request, CACHE_FONTS_FILES));
    return;
  }

  // 5) Bundles propios (JS/CSS/HTML con hash de build) y cualquier otro
  //    recurso del mismo origen: se cachean la primera vez que se piden
  //    online y se sirven de ahí cuando no hay red.
  if (url.origin === self.location.origin) {
    event.respondWith(cachePrimero(request, CACHE_RUNTIME));
  }
});
