import * as React from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from './App'

// In a plain browser (web dev build) there is no Electron preload, so install
// a localStorage-backed ElectronAPI shim before anything renders.
async function bootstrap() {
  if (typeof window !== 'undefined' && !window.electronAPI) {
    const { installWebShim } = await import('./web/shim')
    installWebShim()
  }

  const root = document.getElementById('root')
  if (!root) throw new Error('Root element not found')

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
