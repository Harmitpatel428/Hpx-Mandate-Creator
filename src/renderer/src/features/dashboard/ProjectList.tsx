import * as React from 'react'
import { FileText, Search } from 'lucide-react'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { ProjectRecord } from 'shared/ipc/types'

interface ProjectListProps {
  projects: ProjectRecord[]
  searchQuery: string
  onNewProject: () => void
}

export function ProjectList({ projects, searchQuery, onNewProject }: ProjectListProps) {
  if (projects.length === 0 && !searchQuery) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="No mandates yet"
        description="Create your first mandate to get started."
        action={
          <button
            onClick={onNewProject}
            className="rounded-md border border-dashed border-border px-4 py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            Create first mandate
          </button>
        }
      />
    )
  }

  if (projects.length === 0 && searchQuery) {
    return (
      <EmptyState
        icon={<Search className="h-5 w-5" />}
        title="No results"
        description={`No mandates matching "${searchQuery}"`}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
