import type { IProjectRepository, ProjectRow, TemplateRow, ClauseRow } from '../db/repository'
import type {
  TemplateCreateRequest,
  TemplateInstantiateRequest,
  ClauseCreateRequest,
  ClauseListRequest,
} from 'shared/ipc/types'
import { generateId } from 'shared/utils/id'
import { cloneDocumentWithNewIds } from 'shared/document-model/clone'

export class LibraryService {
  constructor(private repo: IProjectRepository) {}

  // ---- Templates ----

  createTemplate(req: TemplateCreateRequest): TemplateRow {
    const now = new Date().toISOString()
    return this.repo.createTemplate({
      id: generateId(),
      name: req.name,
      description: req.description ?? '',
      category: req.category ?? 'General',
      isSample: false,
      createdAt: now,
      updatedAt: now,
      content: req.content,
    })
  }

  listTemplates(): TemplateRow[] {
    return this.repo.listTemplates()
  }

  getTemplate(id: string): TemplateRow | null {
    return this.repo.getTemplate(id)
  }

  deleteTemplate(id: string): void {
    this.repo.deleteTemplate(id)
  }

  /** Create a brand-new project from a template, with all ids regenerated. */
  instantiateTemplate(req: TemplateInstantiateRequest): ProjectRow | null {
    const template = this.repo.getTemplate(req.templateId)
    if (!template) return null

    const id = generateId()
    const content = cloneDocumentWithNewIds(template.content, {
      id,
      title: req.title ?? template.name,
      author: req.author,
      status: 'draft',
    })
    const now = new Date().toISOString()
    return this.repo.createProject({
      id,
      title: content.metadata.title,
      author: content.metadata.author,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      content,
    })
  }

  // ---- Clauses ----

  createClause(req: ClauseCreateRequest): ClauseRow {
    const now = new Date().toISOString()
    return this.repo.createClause({
      id: generateId(),
      name: req.name,
      description: req.description ?? '',
      category: req.category ?? 'General',
      tags: req.tags ?? [],
      isSample: false,
      kind: req.kind,
      section: req.section ?? null,
      blocks: req.blocks ?? [],
      variables: req.variables ?? [],
      createdAt: now,
      updatedAt: now,
    })
  }

  listClauses(req: ClauseListRequest = {}): ClauseRow[] {
    return this.repo.listClauses({ category: req.category, search: req.search })
  }

  getClause(id: string): ClauseRow | null {
    return this.repo.getClause(id)
  }

  deleteClause(id: string): void {
    this.repo.deleteClause(id)
  }
}
