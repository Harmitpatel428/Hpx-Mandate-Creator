import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectCreateRequest, ProjectUpdateRequest } from 'shared/ipc/types'

export function useProject() {
  const navigate = useNavigate()
  const { setProjects, upsertProject, removeProject, setCurrentProject, setDocument, setSaveState } =
    useProjectStore()

  const loadProjects = useCallback(async () => {
    const res = await window.electronAPI.projects.list({})
    if (res.success) {
      setProjects(res.data)
    }
  }, [setProjects])

  const loadProject = useCallback(
    async (id: string) => {
      const res = await window.electronAPI.projects.get({ id })
      if (res.success) {
        setCurrentProject(res.data)
        setDocument(res.data.content)
        setSaveState('saved')
        return res.data
      }
      return null
    },
    [setCurrentProject, setDocument, setSaveState],
  )

  const createProject = useCallback(
    async (req: ProjectCreateRequest) => {
      const res = await window.electronAPI.projects.create(req)
      if (res.success) {
        upsertProject(res.data)
        return res.data
      }
      throw new Error(res.error)
    },
    [upsertProject],
  )

  const updateProject = useCallback(
    async (req: ProjectUpdateRequest) => {
      const res = await window.electronAPI.projects.update(req)
      if (res.success) {
        upsertProject(res.data)
        return res.data
      }
      throw new Error(res.error)
    },
    [upsertProject],
  )

  const archiveProject = useCallback(
    async (id: string) => {
      const res = await window.electronAPI.projects.archive({ id })
      if (res.success) {
        removeProject(id)
      } else {
        throw new Error(res.error)
      }
    },
    [removeProject],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      const res = await window.electronAPI.projects.delete({ id })
      if (res.success) {
        removeProject(id)
        navigate('/')
      } else {
        throw new Error(res.error)
      }
    },
    [removeProject, navigate],
  )

  return { loadProjects, loadProject, createProject, updateProject, archiveProject, deleteProject }
}
