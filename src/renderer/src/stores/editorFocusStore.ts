import { create } from 'zustand'

type InsertFn = (key: string, label?: string) => void

interface EditorFocusStore {
  /** Insert function of the most recently focused paragraph editor, if any. */
  activeInsert: InsertFn | null
  /** Id of the block whose editor is active, for UI affordances. */
  activeBlockId: string | null
  setActiveInsert: (blockId: string, fn: InsertFn) => void
  clearActiveInsert: (blockId: string) => void
}

/**
 * Tracks which paragraph editor is focused so panels (e.g. Variables) can
 * insert a placeholder into it. The last-focused editor stays registered
 * even after blur, so clicking an "Insert" button in a side panel still
 * targets the paragraph the user was editing.
 */
export const useEditorFocusStore = create<EditorFocusStore>((set) => ({
  activeInsert: null,
  activeBlockId: null,
  setActiveInsert: (blockId, fn) => set({ activeInsert: fn, activeBlockId: blockId }),
  clearActiveInsert: (blockId) =>
    set((s) => (s.activeBlockId === blockId ? { activeInsert: null, activeBlockId: null } : s)),
}))
