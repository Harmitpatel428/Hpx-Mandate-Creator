// Uses crypto.randomUUID() to avoid the ESM-only constraint of nanoid v5.
// Works in both Node 15+ (main process) and browser/Electron renderer.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}
