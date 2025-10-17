import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config adjusted for GitHub Pages deployment to the repo site
// If you publish to https://upshawam.github.io/RunMapper set base to '/RunMapper/'
// If you publish to a user site (https://upshawam.github.io) change base to '/'
export default defineConfig({
  base: '/RunMapper/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    sourcemap: false
  }
})
