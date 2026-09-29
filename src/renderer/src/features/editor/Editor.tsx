import * as React from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useAutosave } from '@/hooks/useAutosave'
import { EditorTopBar } from './EditorTopBar'
import { EditorLeftSidebar } from './EditorLeftSidebar'
import { EditorCanvas } from './EditorCanvas'
import { EditorRightPanel } from './EditorRightPanel'

export function Editor() {
  useAutosave()

  const { isLeftSidebarOpen, isRightPanelOpen } = useUiStore()

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
        {isLeftSidebarOpen && <EditorLeftSidebar />}
        <EditorCanvas />
        {isRightPanelOpen && <EditorRightPanel />}
      </div>
    </div>
  )
}
