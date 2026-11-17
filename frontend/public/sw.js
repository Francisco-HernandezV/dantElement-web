const VERSION = "v2";
// Vite reemplaza __BUILD_ID__ en cada build (ver vite.config.js). Así el sw.js
// cambia en cada despliegue, el navegador instala la versión nueva y vuelve a
// precachear los chunks con sus nombres nuevos.
const BUILD = "__BUILD_ID__";
const CACHE_SHELL = `shell-${VERSION}-${BUILD}`;
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
  "/privacidad.html",
];

// Páginas públicas que deben abrir sin internet aunque nunca se hayan visitado.
// Son vistas cargadas con lazy(): su código vive en chunks aparte cuyo nombre
// lleva un hash, así que se buscan en el asset-manifest.json que genera Vite.
const PAGINAS_OFFLINE = [
  "src/pages/legal/Terminos.jsx",
  "src/pages/legal/Privacidad.jsx",
  "src/pages/legal/EliminarCuenta.jsx",
  "src/pages/QuienesSomos.jsx",
  "src/pages/Catalog.jsx",
  "src/pages/ProductDetails.jsx",
  "src/pages/Error404.jsx",
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

// Lee el asset-manifest.json del build y devuelve los archivos (JS, CSS e
// imágenes) de cada página de PAGINAS_OFFLINE junto con todo lo que importan.
async function descubrirPaginasOffline() {
  try {
    const respuesta = await fetch("/asset-manifest.json", { cache: "no-store" });
    if (!respuesta.ok) return [];
    const mapa = await respuesta.json();
    const urls = new Set();
    const visitadas = new Set();
    const visitar = (clave) => {
      const entrada = mapa[clave];
      if (!entrada || visitadas.has(clave)) return;
      visitadas.add(clave);
      urls.add("/" + entrada.file);
      for (const css of entrada.css || []) urls.add("/" + css);
      for (const recurso of entrada.assets || []) urls.add("/" + recurso);
      for (const importada of entrada.imports || []) visitar(importada);
    };
    PAGINAS_OFFLINE.forEach(visitar);
    return [...urls];
  } catch (err) {
    // En "npm run dev" no existe el asset-manifest: no es un error.
    console.warn("[sw] No se pudo leer asset-manifest.json:", err);
    return [];
  }
}

// Datos que necesita la pantalla de inicio para verse completa sin internet:
// la lista de productos, la configuración de la tienda (logo, contacto), la
// imagen de portada y las fotos de los productos que aparecen en el inicio.
// Se guardan al instalar el SW, así funciona aunque sea la primera visita.
const IMAGEN_PORTADA =
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=70";
const PRODUCTOS_EN_INICIO = 8;

function conTiempoLimite(promesa, ms) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Igual que cldUrl() de src/utils/cloudinary.js con "w_400,h_400,c_fill".
function miniaturaCloudinary(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_400,h_400,c_fill/");
}

async function guardarSiResponde(cacheName, url, opciones) {
  try {
    const respuesta = await conTiempoLimite(fetch(url, opciones), 10000);
    if (respuesta.ok) {
      await (await caches.open(cacheName)).put(url, respuesta.clone());
      return respuesta;
    }
  } catch (err) {
    console.warn(`[sw] No se pudo precachear ${url}:`, err);
  }
  return null;
}

async function precachearInicio() {
  const opcionesApi = { mode: "cors", credentials: "include" };
  const [respuestaProductos] = await Promise.all([
    guardarSiResponde(CACHE_API, `${API_ORIGIN}/api/admin/productos`, opcionesApi),
    guardarSiResponde(CACHE_API, `${API_ORIGIN}/api/admin/configuracion`, opcionesApi),
    guardarSiResponde(CACHE_IMAGES, IMAGEN_PORTADA, { mode: "cors" }),
  ]);
  if (!respuestaProductos) return;
  try {
    const productos = await respuestaProductos.json();
    const fotos = productos
      .filter((p) => p.activo && p.imagen)
      .slice(0, PRODUCTOS_EN_INICIO)
      .map((p) => miniaturaCloudinary(p.imagen));
    await Promise.all(fotos.map((url) => guardarSiResponde(CACHE_IMAGES, url, { mode: "cors" })));
  } catch (err) {
    console.warn("[sw] No se pudieron precachear las fotos del inicio:", err);
  }
}

// Guarda en CACHE_SHELL todo lo que debe abrir sin internet (esqueleto, bundle
// principal y páginas de PAGINAS_OFFLINE) y descarga solo lo que falte. Se
// llama al instalar y otra vez al navegar con internet, así la caché se repara
// sola si la instalación quedó incompleta o si alguien borró la caché.
async function completarPrecache() {
  const [bundlePrincipal, paginasOffline] = await Promise.all([
    descubrirBundlePrincipal(),
    descubrirPaginasOffline(),
  ]);
  const urls = [...new Set([...APP_SHELL, ...bundlePrincipal, ...paginasOffline])];
  const cache = await caches.open(CACHE_SHELL);
  let descargados = 0;
  let fallidos = 0;
  await Promise.all(
    urls.map(async (url) => {
      if (await cache.match(url, { ignoreVary: true })) return;
      try {
        await cache.add(url);
        descargados++;
      } catch (err) {
        fallidos++;
        console.warn(`[sw] No se pudo precachear ${url}:`, err);
      }
    })
  );
  console.info(
    `[sw] Precaché ${CACHE_SHELL}: ${urls.length} archivos (páginas offline: ${paginasOffline.length}, ` +
      `descargados ahora: ${descargados}, fallidos: ${fallidos})`
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await completarPrecache();
      // Si el servidor tarda o falla, el SW se instala igual: solo falta este extra.
      await precachearInicio();
    })()
  );
});

// Revisión periódica de la precaché mientras hay internet (máximo 1 por minuto).
let ultimaRevision = 0;
function revisarPrecache(event) {
  const ahora = Date.now();
  if (ahora - ultimaRevision < 60000) return;
  ultimaRevision = ahora;
  event.waitUntil(completarPrecache().catch((err) => console.warn("[sw] Revisión de precaché:", err)));
}

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
    const cacheada = await cache.match(request, { ignoreVary: true });
    if (cacheada) return cacheada;
    throw new Error("Sin red y sin caché para " + request.url);
  }
}
async function cacheYRevalida(request, cacheName) {
  const cache = await caches.open(cacheName);
  // ignoreVary: Cloudinary y Unsplash varían el formato según el encabezado
  // Accept; sin esto las fotos guardadas al instalar no coincidirían.
  const cacheada = await cache.match(request, { ignoreVary: true });
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
  // Se busca en TODAS las cachés, no solo en cacheName: los chunks de las
  // páginas offline se guardan en CACHE_SHELL al instalar el SW.
  // ignoreVary: algunos servidores (p. ej. vite preview) responden con
  // "Vary: Origin"; lo guardado por el SW no traía ese encabezado y no
  // coincidiría con lo que pide la página. Los assets llevan hash: es seguro.
  const cacheada = await caches.match(request, { ignoreVary: true });
  if (cacheada) return cacheada;
  const respuestaRed = await fetch(request);
  if (respuestaRed.ok || respuestaRed.type === "opaque") {
    cache.put(request, respuestaRed.clone());
  }
  return respuestaRed;
}

// Navegación (abrir una URL): primero la red; sin red, siempre el index.html
// guardado, porque todas las rutas (/terminos, /quienes-somos...) son la misma
// app de React. Solo se actualiza la copia de /index.html, no una por URL: así
// la caché no crece y nunca se sirve otra página por error (p. ej. el
// privacidad.html de Alexa en lugar de la ruta /privacidad).
async function navegacion(event, url) {
  const { request } = event;
  try {
    const respuesta = await conTiempoLimite(fetch(request), 5000);
    if (respuesta.ok && (url.pathname === "/" || url.pathname === "/index.html")) {
      const cache = await caches.open(CACHE_SHELL);
      await cache.put("/index.html", respuesta.clone());
    }
    if (respuesta.ok) revisarPrecache(event);
    return respuesta;
  } catch {
    const pagina = url.pathname === "/privacidad.html" ? "/privacidad.html" : "/index.html";
    return (await caches.match(pagina, { ignoreVary: true })) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(navegacion(event, url));
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
