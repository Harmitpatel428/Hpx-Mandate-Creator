import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Browser dev build: runs the renderer with a localStorage-backed shim
// instead of Electron. Root is the renderer folder; shared/ and main type
// imports resolve via the alias + fs.allow to the repo root.
const repoRoot = resolve(__dirname)

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      shared: resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: resolve(__dirname, 'out-web'),
    emptyOutDir: true,
  },
})
