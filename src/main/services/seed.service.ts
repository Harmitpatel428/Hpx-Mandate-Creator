import type { IProjectRepository } from '../db/repository'
import { generateId } from 'shared/utils/id'
import {
  buildSampleMandate,
  buildSampleTemplateDoc,
  buildSampleClauses,
} from 'shared/seed/sample-content'

const SEED_FLAG = 'seed:v1'

/**
 * Seed sample content once, on first launch. Idempotent: guarded by a
 * persisted flag so it never re-seeds or duplicates.
 */
export function seedIfFirstRun(repo: IProjectRepository): void {
  if (repo.getSetting(SEED_FLAG)) return

  const now = new Date().toISOString()

  const mandate = buildSampleMandate()
  repo.createProject({
    id: mandate.id,
    title: mandate.metadata.title,
    author: mandate.metadata.author,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    content: mandate,
  })

  const templateDoc = buildSampleTemplateDoc()
  repo.createTemplate({
    id: generateId(),
    name: 'Mutual NDA (Sample)',
    description: templateDoc.metadata.description,
    category: 'NDA',
    isSample: true,
    createdAt: now,
    updatedAt: now,
    content: templateDoc,
  })

  for (const clause of buildSampleClauses(now)) {
    repo.createClause(clause)
  }

  repo.setSetting(SEED_FLAG, now)
}
