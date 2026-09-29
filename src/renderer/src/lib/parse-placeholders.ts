const PLACEHOLDER_RE = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

export function extractPlaceholderKeys(text: string): string[] {
  if (!text || typeof text !== 'string') return []
  const keys = new Set<string>()
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    keys.add(match[1])
  }
  return [...keys]
}

export function resolvePlaceholders(text: string, values: Record<string, unknown>): string {
  if (!text || typeof text !== 'string') return text
  return text.replace(PLACEHOLDER_RE, (_, key) => {
    const val = values[key]
    return val != null ? String(val) : `{{${key}}}`
  })
}

export function extractPlaceholderKeysFromTiptapJson(json: unknown): string[] {
  if (!json || typeof json !== 'object') return []
  const keys = new Set<string>()

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>

    // variablePlaceholder node
    if (n.type === 'variablePlaceholder' && n.attrs && typeof n.attrs === 'object') {
      const attrs = n.attrs as Record<string, unknown>
      if (typeof attrs.key === 'string') keys.add(attrs.key)
    }

    // text nodes
    if (typeof n.text === 'string') {
      for (const k of extractPlaceholderKeys(n.text)) keys.add(k)
    }

    // recurse
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }

  walk(json)
  return [...keys]
}
