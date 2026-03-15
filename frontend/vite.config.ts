import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy HTTP GraphQL requests to the backend during dev
      '/graphql': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // also proxy WebSocket upgrades for subscriptions
      },
      // Proxy REST upload/delete endpoints
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy uploaded static files (book covers)
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
