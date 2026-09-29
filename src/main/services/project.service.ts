import type { IProjectRepository, ProjectRow, ProjectVersionRow } from '../db/repository'
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectSaveVersionRequest,
  ProjectListRequest,
} from 'shared/ipc/types'
import { createDefaultDocument } from 'shared/document-model/defaults'
import { generateId } from 'shared/utils/id'

export class ProjectService {
  constructor(private repo: IProjectRepository) {}

  createProject(req: ProjectCreateRequest): ProjectRow {
    const now = new Date().toISOString()
    const id = generateId()
    const content = createDefaultDocument({
      id,
      title: req.title,
      author: req.author,
    })
    if (req.content) {
      Object.assign(content.metadata, req.content.metadata ?? {})
    }
    return this.repo.createProject({
      id,
      title: req.title,
      author: req.author ?? '',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      content,
    })
  }

  listProjects(req: ProjectListRequest = {}): ProjectRow[] {
    return this.repo.listProjects({
      includeArchived: req.includeArchived,
      search: req.search,
    })
  }

  getProject(id: string): ProjectRow | null {
    return this.repo.getProject(id)
  }

  updateProject(req: ProjectUpdateRequest): ProjectRow | null {
    const now = new Date().toISOString()
    return this.repo.updateProject({
      id: req.id,
      title: req.title,
      author: req.author,
      status: req.status,
      content: req.content,
      updatedAt: now,
    })
  }

  archiveProject(id: string): void {
    this.repo.archiveProject(id, new Date().toISOString())
  }

  deleteProject(id: string): void {
    this.repo.deleteProject(id)
  }

  saveVersion(req: ProjectSaveVersionRequest): ProjectVersionRow {
    const now = new Date().toISOString()
    const versionNum = this.repo.getNextVersionNum(req.projectId)
    const version = this.repo.saveVersion({
      id: generateId(),
      projectId: req.projectId,
      versionNum,
      content: req.content,
      createdAt: now,
      label: req.label ?? `v${versionNum}`,
    })
    // Keep the project's updated_at in sync and content current
    this.repo.updateProject({
      id: req.projectId,
      content: req.content,
      updatedAt: now,
    })
    return version
  }

  listVersions(projectId: string): ProjectVersionRow[] {
    return this.repo.listVersions(projectId)
  }

  getVersion(versionId: string): ProjectVersionRow | null {
    return this.repo.getVersion(versionId)
  }
}
