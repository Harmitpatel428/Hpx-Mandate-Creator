import * as React from 'react'
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchBar } from './SearchBar'
import { ProjectList } from './ProjectList'
import { NewProjectModal } from './NewProjectModal'
import { TemplateGallery } from '../library/TemplateGallery'
import { useUiStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useProject } from '@/hooks/useProject'
import { CardGridSkeleton } from '@/components/ui/skeleton'

type Tab = 'mandates' | 'templates'

export function Dashboard() {
  const { searchQuery } = useUiStore()
  const { projects } = useProjectStore()
  const { loadProjects } = useProject()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('mandates')

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
        <div className="flex items-center gap-4 titlebar-no-drag">
          <div className="inline-flex rounded-md bg-secondary p-0.5">
            {(['mandates', 'templates'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                  tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 titlebar-no-drag">
          {tab === 'mandates' && <SearchBar />}
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Mandate
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'templates' ? (
          <TemplateGallery />
        ) : isLoading ? (
          <CardGridSkeleton />
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
