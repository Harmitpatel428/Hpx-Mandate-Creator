import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MandateDocument, SaveState } from 'shared/document-model/types'
import type { ProjectRecord } from 'shared/ipc/types'

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

  // Save state
  saveState: SaveState
  setSaveState: (state: SaveState) => void

  // Last saved version id (for autosave tracking)
  lastSavedVersionId: string | null
  setLastSavedVersionId: (id: string | null) => void
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
