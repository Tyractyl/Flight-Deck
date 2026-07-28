import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Block direct browser access to source files (/src/*, /node_modules/*)
 * during development. These are still served for HMR imports, but
 * navigating to e.g. http://localhost:17000/src/App.tsx returns 403.
 */
function blockSourceAccess(): Plugin {
  return {
    name: 'block-source-access',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        // Block direct navigation to source dirs
        if (
          url.startsWith('/src/') ||
          url.startsWith('/node_modules/') ||
          url.startsWith('/@fs/')
        ) {
          // Allow Vite's internal module requests (they carry sec-fetch-mode: cors
          // or Accept: application/javascript etc.)
          const accept = req.headers['accept'] ?? ''
          const secFetch = req.headers['sec-fetch-mode'] ?? ''
          if (secFetch === 'cors' || secFetch === 'no-cors' || accept.includes('javascript')) {
            return next()
          }
          // Block direct browser navigation
          res.writeHead(403, { 'Content-Type': 'text/plain' })
          res.end('Forbidden')
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), blockSourceAccess()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@workspace/ui': path.resolve(__dirname, './node_modules/parthenon-ui/src'),
    },
  },
  server: {
    port: 17000,
    proxy: {
      '/api': {
        target: 'http://localhost:16000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:16000',
        changeOrigin: true,
      },
    },
  },
})
