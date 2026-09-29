import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'

const AUTOSAVE_DELAY_MS = 1500

export function useAutosave(): void {
  const document = useProjectStore((s) => s.document)
  const saveState = useProjectStore((s) => s.saveState)
  const currentProject = useProjectStore((s) => s.currentProject)
  const setSaveState = useProjectStore((s) => s.setSaveState)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const docRef = useRef(document)
  docRef.current = document

  useEffect(() => {
    if (saveState !== 'unsaved') return
    if (!currentProject || !document) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (!docRef.current || !currentProject) return
      setSaveState('saving')
      try {
        // Autosave updates the project content in place — it does NOT create
        // a version. Version snapshots are explicit (Ctrl+S / snapshot button).
        const res = await window.electronAPI.projects.update({
          id: currentProject.id,
          content: docRef.current,
        })
        if (res.success) {
          setSaveState('saved')
        } else {
          setSaveState('error')
          console.error('[Autosave] Save failed:', res.error)
        }
      } catch (err) {
        setSaveState('error')
        console.error('[Autosave] Exception:', err)
      }
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [saveState, document, currentProject, setSaveState])
}
