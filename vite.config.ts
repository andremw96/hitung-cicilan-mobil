import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Set to `/repo-name/` when hosting on GitHub Pages (project site). */
const base = process.env.VITE_BASE_URL?.trim() || '/'

export default defineConfig({
  plugins: [react()],
  base: base.endsWith('/') || base === '/' ? base : `${base}/`,
})
