import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'

const AUTOSAVE_DELAY_MS = 1500

export function useAutosave(): void {
  const document = useProjectStore((s) => s.document)
  const saveState = useProjectStore((s) => s.saveState)
  const currentProject = useProjectStore((s) => s.currentProject)
  const setSaveState = useProjectStore((s) => s.setSaveState)
  const setLastSavedVersionId = useProjectStore((s) => s.setLastSavedVersionId)

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
        const res = await window.electronAPI.projects.saveVersion({
          projectId: currentProject.id,
          content: docRef.current,
        })
        if (res.success) {
          setSaveState('saved')
          setLastSavedVersionId(res.data.id)
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
  }, [saveState, document, currentProject, setSaveState, setLastSavedVersionId])
}
