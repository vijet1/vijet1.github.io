import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "https://github.com/vijet1/vijet1.github.io.git",
  plugins: [react()],
})
