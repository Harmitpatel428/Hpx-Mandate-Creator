import * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Archive, Trash2, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ProjectRecord } from 'shared/ipc/types'
import { PROJECT_STATUS_LABELS } from 'shared/document-model/types'
import { formatRelative } from 'shared/utils/format'
import { useProject } from '@/hooks/useProject'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: ProjectRecord
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()
  const { archiveProject, deleteProject } = useProject()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteProject(project.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function handleArchive() {
    await archiveProject(project.id)
  }

  const statusVariant = project.status as Parameters<typeof Badge>[0]['variant']

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer',
          'hover:border-primary/30 hover:bg-card/80 transition-all duration-150',
          'animate-fade-in',
        )}
        onClick={() => navigate(`/editor/${project.id}`)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate leading-tight" title={project.title}>
              {project.title}
            </h3>
            {project.author && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.author}</p>
            )}
          </div>
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-7 w-7"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/editor/${project.id}`)
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleArchive()
                }}
              >
                <Archive className="h-3.5 w-3.5 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteDialog(true)
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <Badge variant={statusVariant}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
          <span className="text-xs text-muted-foreground/60">{formatRelative(project.updatedAt)}</span>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete mandate?</DialogTitle>
            <DialogDescription>
              "{project.title}" will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
