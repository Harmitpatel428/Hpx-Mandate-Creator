import * as React from 'react'
import { useEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAutosave } from '@/hooks/useAutosave'
import { useDocumentHistory } from '@/hooks/useDocumentHistory'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { EditorTopBar } from './EditorTopBar'
import { EditorLeftSidebar } from './EditorLeftSidebar'
import { EditorCanvas } from './EditorCanvas'
import { EditorRightPanel } from './EditorRightPanel'

function isEditableTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node) return false
  const tag = node.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable
}

export function Editor() {
  useAutosave()
  const { undo, redo } = useDocumentHistory()

  const { isLeftSidebarOpen, isRightPanelOpen, activeSectionId, setActiveBlockId } = useUiStore()

  useEffect(() => {
    async function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      const key = e.key.toLowerCase()

      // Save snapshot
      if (key === 's') {
        e.preventDefault()
        const { currentProject, document, setSaveState } = useProjectStore.getState()
        if (!currentProject || !document) return
        setSaveState('saving')
        try {
          const res = await window.electronAPI.projects.saveVersion({
            projectId: currentProject.id,
            content: document,
            label: `Snapshot ${new Date().toLocaleTimeString()}`,
          })
          setSaveState(res.success ? 'saved' : 'error')
        } catch {
          setSaveState('error')
        }
        return
      }

      // New block (paragraph) in the active or last section
      if (key === 'enter') {
        e.preventDefault()
        const store = useProjectStore.getState()
        const doc = store.document
        if (!doc || doc.sections.length === 0) return
        const targetId = activeSectionId && doc.sections.some((s) => s.id === activeSectionId)
          ? activeSectionId
          : doc.sections[doc.sections.length - 1].id
        const blockId = store.addBlock(targetId, 'paragraph')
        setActiveBlockId(blockId)
        return
      }

      // Undo / redo — but let native text fields handle their own history.
      if ((key === 'z' || key === 'y') && !isEditableTarget(e.target)) {
        e.preventDefault()
        if (key === 'y' || (key === 'z' && e.shiftKey)) redo()
        else undo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, activeSectionId, setActiveBlockId])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorTopBar />
      <div
        className="flex flex-1 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `${isLeftSidebarOpen ? '236px' : '0'} 1fr ${isRightPanelOpen ? '256px' : '0'}`,
          transition: 'grid-template-columns 0.2s ease',
        }}
      >
        {isLeftSidebarOpen && (
          <ErrorBoundary>
            <EditorLeftSidebar />
          </ErrorBoundary>
        )}
        <ErrorBoundary>
          <EditorCanvas />
        </ErrorBoundary>
        {isRightPanelOpen && (
          <ErrorBoundary>
            <EditorRightPanel />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
