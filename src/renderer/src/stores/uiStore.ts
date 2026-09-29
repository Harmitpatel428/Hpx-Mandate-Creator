import { create } from 'zustand'

type ActivePanel = 'properties' | 'variables' | 'logic' | 'validation' | 'clauses' | 'versions' | 'settings'

interface UiStore {
  searchQuery: string
  setSearchQuery: (q: string) => void

  isLeftSidebarOpen: boolean
  toggleLeftSidebar: () => void
  setLeftSidebarOpen: (open: boolean) => void

  isRightPanelOpen: boolean
  toggleRightPanel: () => void
  setRightPanelOpen: (open: boolean) => void

  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void

  activeSectionId: string | null
  setActiveSectionId: (id: string | null) => void

  activeBlockId: string | null
  setActiveBlockId: (id: string | null) => void
}

export const useUiStore = create<UiStore>()((set) => ({
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  isLeftSidebarOpen: true,
  toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
  setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),

  isRightPanelOpen: true,
  toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),

  activePanel: 'properties',
  setActivePanel: (panel) => set({ activePanel: panel }),

  activeSectionId: null,
  setActiveSectionId: (id) => set({ activeSectionId: id }),

  activeBlockId: null,
  setActiveBlockId: (id) => set({ activeBlockId: id }),
}))
