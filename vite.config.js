import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // forward /api calls to the Express server (no CORS headaches in dev)
  server: { proxy: { "/api": "http://localhost:4000" } },
})
