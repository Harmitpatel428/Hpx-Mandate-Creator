import * as React from 'react'
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from './SearchBar'
import { ProjectList } from './ProjectList'
import { NewProjectModal } from './NewProjectModal'
import { useUiStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useProject } from '@/hooks/useProject'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function Dashboard() {
  const { searchQuery } = useUiStore()
  const { projects } = useProjectStore()
  const { loadProjects } = useProject()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProjects().finally(() => setIsLoading(false))
  }, [loadProjects])

  const filtered = searchQuery
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : projects

  const active = filtered.filter((p) => p.status !== 'archived')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 titlebar-drag">
        <div className="titlebar-no-drag">
          <h1 className="text-sm font-semibold text-foreground">Mandates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {projects.filter((p) => p.status !== 'archived').length} active
          </p>
        </div>
        <div className="flex items-center gap-2 titlebar-no-drag">
          <SearchBar />
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Mandate
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <ProjectList
            projects={active}
            searchQuery={searchQuery}
            onNewProject={() => setIsModalOpen(true)}
          />
        )}
      </div>

      <NewProjectModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
