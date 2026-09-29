import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Download, Eye, LayoutTemplate } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AutosaveIndicator } from './AutosaveIndicator'
import { ExportModal } from './ExportModal'
import { SaveTemplateModal } from '../library/SaveTemplateModal'
import { useProjectStore } from '@/stores/projectStore'
import { useProject } from '@/hooks/useProject'

export function EditorTopBar() {
  const navigate = useNavigate()
  const currentProject = useProjectStore((s) => s.currentProject)
  const document = useProjectStore((s) => s.document)
  const patchDocument = useProjectStore((s) => s.patchDocument)
  const setSaveState = useProjectStore((s) => s.setSaveState)
  const { updateProject } = useProject()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handlePreview() {
    if (!currentProject || !document) return
    // Persist current edits so the preview (which loads from the DB) is current.
    try {
      await updateProject({ id: currentProject.id, content: document })
      setSaveState('saved')
    } catch (err) {
      console.error('Failed to save before preview:', err)
    }
    navigate(`/preview/${currentProject.id}`)
  }

  const title = document?.metadata.title ?? currentProject?.title ?? 'Untitled'

  function startEditing() {
    setTitleDraft(title)
    setIsEditingTitle(true)
  }

  useEffect(() => {
    if (isEditingTitle) inputRef.current?.select()
  }, [isEditingTitle])

  async function commitTitle() {
    const trimmed = titleDraft.trim()
    if (!trimmed || !currentProject) {
      setIsEditingTitle(false)
      return
    }
    setIsEditingTitle(false)
    patchDocument({ metadata: { ...document!.metadata, title: trimmed } })
    setSaveState('unsaved')
    try {
      await updateProject({ id: currentProject.id, title: trimmed })
    } catch (err) {
      console.error('Failed to update project title:', err)
    }
  }

  return (
    <div className="flex h-12 items-center gap-2 border-b border-border bg-sidebar px-3 shrink-0 titlebar-drag">
      {/* Back button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="titlebar-no-drag"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Back to dashboard</TooltipContent>
      </Tooltip>

      {/* Document title */}
      <div className="flex-1 min-w-0 titlebar-no-drag">
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') setIsEditingTitle(false)
            }}
            className="w-full max-w-sm bg-transparent text-sm font-medium outline-none border-b border-primary pb-0.5 text-foreground"
            maxLength={200}
          />
        ) : (
          <button
            onClick={startEditing}
            title={title}
            className="text-sm font-medium text-foreground truncate max-w-sm hover:text-primary transition-colors cursor-text text-left"
          >
            {title}
          </button>
        )}
      </div>

      {/* Save state indicator */}
      <div className="titlebar-no-drag">
        <AutosaveIndicator />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 titlebar-no-drag">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => setTemplateOpen(true)} disabled={!currentProject}>
              <LayoutTemplate className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save as template</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handlePreview} disabled={!currentProject}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => setExportOpen(true)} disabled={!currentProject}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export</TooltipContent>
        </Tooltip>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <SaveTemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  )
}
