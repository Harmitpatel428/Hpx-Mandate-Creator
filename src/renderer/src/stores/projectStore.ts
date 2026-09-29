import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MandateDocument, Block, Variable, SaveState, LogicRule } from 'shared/document-model/types'
import type { ProjectRecord } from 'shared/ipc/types'
import { generateId } from 'shared/utils/id'

interface ProjectStore {
  // All projects (dashboard list)
  projects: ProjectRecord[]
  setProjects: (projects: ProjectRecord[]) => void
  upsertProject: (project: ProjectRecord) => void
  removeProject: (id: string) => void

  // Active project in editor
  currentProject: ProjectRecord | null
  setCurrentProject: (project: ProjectRecord | null) => void

  // Active document (possibly modified)
  document: MandateDocument | null
  setDocument: (doc: MandateDocument | null) => void
  patchDocument: (patch: Partial<MandateDocument>) => void
  // Replace the whole document from an undo/redo history step (marks unsaved).
  applyHistoryDocument: (doc: MandateDocument) => void

  // Section actions
  addSection: (title?: string) => void
  removeSection: (sectionId: string) => void
  updateSection: (sectionId: string, patch: { title?: string; numbering?: boolean; hidden?: boolean; locked?: boolean }) => void
  reorderSections: (orderedIds: string[]) => void

  // Block actions
  addBlock: (sectionId: string, type: Block['type']) => string
  removeBlock: (sectionId: string, blockId: string) => void
  updateBlock: (sectionId: string, blockId: string, patch: Partial<Block>) => void
  reorderBlocks: (sectionId: string, orderedIds: string[]) => void

  // Variable actions
  addVariable: (data: Omit<Variable, 'id'>) => void
  updateVariable: (id: string, patch: Partial<Omit<Variable, 'id'>>) => void
  removeVariable: (id: string) => void
  setVariableValue: (key: string, value: unknown) => void

  // Rule actions
  addRule: (rule: LogicRule) => void
  updateRule: (id: string, patch: Partial<LogicRule>) => void
  removeRule: (id: string) => void

  // Save state
  saveState: SaveState
  setSaveState: (state: SaveState) => void

  // Last saved version id (for autosave tracking)
  lastSavedVersionId: string | null
  setLastSavedVersionId: (id: string | null) => void
}

function makeDefaultBlock(type: Block['type']): Block {
  const base = { id: generateId(), hidden: false, locked: false, required: false }
  switch (type) {
    case 'heading':
      return { ...base, type: 'heading', level: 2, content: 'New Heading' }
    case 'paragraph':
      return { ...base, type: 'paragraph', content: null }
    case 'plain-text':
      return { ...base, type: 'plain-text', content: '', label: '' }
    case 'page-break':
      return { ...base, type: 'page-break' }
    case 'note':
      return { ...base, type: 'note', content: '', noteType: 'internal' }
    case 'signature':
      return { ...base, type: 'signature', signatoryName: '', signatoryTitle: '', showDateLine: true, showPlaceLine: false }
    case 'table':
      return {
        ...base,
        type: 'table',
        columns: [
          { id: generateId(), header: 'Column 1' },
          { id: generateId(), header: 'Column 2' },
        ],
        rows: [],
      }
    default:
      return { ...base, type: 'paragraph', content: null }
  }
}

export const useProjectStore = create<ProjectStore>()(
  immer((set) => ({
    projects: [],
    setProjects: (projects) =>
      set((state) => {
        state.projects = projects
      }),
    upsertProject: (project) =>
      set((state) => {
        const idx = state.projects.findIndex((p) => p.id === project.id)
        if (idx >= 0) {
          state.projects[idx] = project
        } else {
          state.projects.unshift(project)
        }
      }),
    removeProject: (id) =>
      set((state) => {
        state.projects = state.projects.filter((p) => p.id !== id)
      }),

    currentProject: null,
    setCurrentProject: (project) =>
      set((state) => {
        state.currentProject = project
      }),

    document: null,
    setDocument: (doc) =>
      set((state) => {
        state.document = doc
        state.saveState = 'saved'
      }),
    patchDocument: (patch) =>
      set((state) => {
        if (!state.document) return
        Object.assign(state.document, patch)
        state.saveState = 'unsaved'
      }),
    applyHistoryDocument: (doc) =>
      set((state) => {
        state.document = doc
        state.saveState = 'unsaved'
      }),

    // Section actions
    addSection: (title = 'New Section') =>
      set((state) => {
        if (!state.document) return
        const idx = state.document.sections.length
        state.document.sections.push({
          id: generateId(),
          title,
          numbering: true,
          hidden: false,
          locked: false,
          required: false,
          blocks: [],
          order: idx,
        })
        state.saveState = 'unsaved'
      }),

    removeSection: (sectionId) =>
      set((state) => {
        if (!state.document) return
        state.document.sections = state.document.sections.filter((s) => s.id !== sectionId)
        state.saveState = 'unsaved'
      }),

    updateSection: (sectionId, patch) =>
      set((state) => {
        if (!state.document) return
        const sec = state.document.sections.find((s) => s.id === sectionId)
        if (sec) Object.assign(sec, patch)
        state.saveState = 'unsaved'
      }),

    reorderSections: (orderedIds) =>
      set((state) => {
        if (!state.document) return
        const map = new Map(state.document.sections.map((s) => [s.id, s]))
        state.document.sections = orderedIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : []))
        state.saveState = 'unsaved'
      }),

    // Block actions
    addBlock: (sectionId, type) => {
      const block = makeDefaultBlock(type)
      set((state) => {
        if (!state.document) return
        const sec = state.document.sections.find((s) => s.id === sectionId)
        if (sec) sec.blocks.push(block as never)
        state.saveState = 'unsaved'
      })
      return block.id
    },

    removeBlock: (sectionId, blockId) =>
      set((state) => {
        if (!state.document) return
        const sec = state.document.sections.find((s) => s.id === sectionId)
        if (sec) sec.blocks = sec.blocks.filter((b) => b.id !== blockId)
        state.saveState = 'unsaved'
      }),

    updateBlock: (sectionId, blockId, patch) =>
      set((state) => {
        if (!state.document) return
        const sec = state.document.sections.find((s) => s.id === sectionId)
        if (!sec) return
        const block = sec.blocks.find((b) => b.id === blockId)
        if (block) Object.assign(block, patch)
        state.saveState = 'unsaved'
      }),

    reorderBlocks: (sectionId, orderedIds) =>
      set((state) => {
        if (!state.document) return
        const sec = state.document.sections.find((s) => s.id === sectionId)
        if (!sec) return
        const map = new Map(sec.blocks.map((b) => [b.id, b]))
        sec.blocks = orderedIds.flatMap((id) => (map.has(id) ? [map.get(id)!] : []))
        state.saveState = 'unsaved'
      }),

    // Variable actions
    addVariable: (data) =>
      set((state) => {
        if (!state.document) return
        state.document.variables.push({ id: generateId(), ...data } as never)
        state.saveState = 'unsaved'
      }),

    updateVariable: (id, patch) =>
      set((state) => {
        if (!state.document) return
        const v = state.document.variables.find((v) => v.id === id)
        if (v) Object.assign(v, patch)
        state.saveState = 'unsaved'
      }),

    removeVariable: (id) =>
      set((state) => {
        if (!state.document) return
        state.document.variables = state.document.variables.filter((v) => v.id !== id)
        state.saveState = 'unsaved'
      }),

    setVariableValue: (key, value) =>
      set((state) => {
        if (!state.document) return
        state.document.variableValues[key] = value
        state.saveState = 'unsaved'
      }),

    // Rule actions
    addRule: (rule) =>
      set((state) => {
        if (!state.document) return
        state.document.rules.push(rule as never)
        state.saveState = 'unsaved'
      }),

    updateRule: (id, patch) =>
      set((state) => {
        if (!state.document) return
        const r = state.document.rules.find((r) => r.id === id)
        if (r) Object.assign(r, patch)
        state.saveState = 'unsaved'
      }),

    removeRule: (id) =>
      set((state) => {
        if (!state.document) return
        state.document.rules = state.document.rules.filter((r) => r.id !== id)
        state.saveState = 'unsaved'
      }),

    saveState: 'saved',
    setSaveState: (s) =>
      set((state) => {
        state.saveState = s
      }),

    lastSavedVersionId: null,
    setLastSavedVersionId: (id) =>
      set((state) => {
        state.lastSavedVersionId = id
      }),
  })),
)
