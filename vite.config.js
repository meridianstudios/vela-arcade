import { defineConfig } from 'vite'

// __BUILD__ names this build, so the service worker (public/sw.js) starts a
// fresh cache with every deploy.
export default defineConfig({
  define: { __BUILD__: JSON.stringify(Date.now().toString(36)) },
})
