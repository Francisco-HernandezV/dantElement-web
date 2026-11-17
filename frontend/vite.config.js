import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Pone un identificador único en dist/sw.js en cada build (reemplaza
// __BUILD_ID__). Sin esto el sw.js sería idéntico entre despliegues y el
// navegador no volvería a precachear los chunks nuevos.
function selloServiceWorker() {
  let outDir = 'dist'
  return {
    name: 'sello-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const ruta = resolve(outDir, 'sw.js')
      if (!existsSync(ruta)) return
      const id = Date.now().toString(36)
      writeFileSync(ruta, readFileSync(ruta, 'utf8').replace('"__BUILD_ID__"', `"${id}"`))
    },
  }
}

// https://vite.dev/config/
// En "npm run dev" y "npm run preview", Vite sirve public/privacidad.html cuando
// se pide /privacidad, y esa página redirige a /privacidad sin fin. En Vercel
// /privacidad ya va a index.html (rewrite de vercel.json). Esto iguala el
// comportamiento local: /privacidad abre la página de React.
function rutaPrivacidadSpa() {
  const reescribir = (req, _res, next) => {
    if (req.url && req.url.split('?')[0] === '/privacidad') req.url = '/index.html'
    next()
  }
  return {
    name: 'ruta-privacidad-spa',
    configureServer(server) { server.middlewares.use(reescribir) },
    configurePreviewServer(server) { server.middlewares.use(reescribir) },
  }
}

export default defineConfig({
  plugins: [
    react(),
    selloServiceWorker(),
    rutaPrivacidadSpa(),
  ],
  build: {
    // Mapa de archivos del build (dist/asset-manifest.json). El service worker
    // lo lee para precachear las páginas públicas que se cargan con lazy().
    manifest: 'asset-manifest.json',
    // esbuild es el minificador por defecto de Vite en producción; lo dejamos
    // explícito para que la minificación de JS quede documentada y garantizada.
    minify: 'esbuild',
    // Separamos las dependencias grandes en chunks propios. Así el navegador
    // solo descarga recharts / react-colorful cuando entra a las vistas que las
    // usan (panel admin), y el vendor de React se cachea entre despliegues.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          'color-picker': ['react-colorful'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
