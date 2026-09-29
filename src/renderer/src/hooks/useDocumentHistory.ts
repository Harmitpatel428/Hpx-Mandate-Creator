import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import type { MandateDocument } from 'shared/document-model/types'

const MAX_HISTORY = 100
const COALESCE_MS = 500

/**
 * Document-level undo/redo. Records a snapshot of the document before each
 * user edit (coalescing rapid edits within COALESCE_MS into one step) and
 * lets the user step backward/forward. History resets when a different
 * document is loaded or restored (saveState === 'saved' after a change).
 */
export function useDocumentHistory() {
  const applyHistoryDocument = useProjectStore((s) => s.applyHistoryDocument)
  const past = useRef<MandateDocument[]>([])
  const future = useRef<MandateDocument[]>([])
  const applying = useRef(false)
  const lastRecordAt = useRef(0)
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  useEffect(() => {
    // Vanilla subscribe: fires on every store change with (state, prevState).
    const unsub = useProjectStore.subscribe((state, prev) => {
      if (state.document === prev.document) return

      if (applying.current) {
        applying.current = false
        rerender()
        return
      }

      // A fresh load or a restore comes through as saveState 'saved'.
      if (state.saveState === 'saved') {
        past.current = []
        future.current = []
        rerender()
        return
      }

      // A user edit: record the previous document as an undo point.
      if (prev.document) {
        const now = Date.now()
        if (now - lastRecordAt.current > COALESCE_MS || past.current.length === 0) {
          past.current.push(prev.document)
          if (past.current.length > MAX_HISTORY) past.current.shift()
        }
        lastRecordAt.current = now
        future.current = []
        rerender()
      }
    })
    return unsub
  }, [])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    const current = useProjectStore.getState().document
    if (current) future.current.unshift(current)
    applying.current = true
    applyHistoryDocument(prev)
  }, [applyHistoryDocument])

  const redo = useCallback(() => {
    const next = future.current.shift()
    if (!next) return
    const current = useProjectStore.getState().document
    if (current) past.current.push(current)
    applying.current = true
    applyHistoryDocument(next)
  }, [applyHistoryDocument])

  return { undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 }
}
