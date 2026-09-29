import * as React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Editor } from '@/features/editor/Editor'
import { useProject } from '@/hooks/useProject'
import { useProjectStore } from '@/stores/projectStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function EditorRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loadProject } = useProject()
  const { currentProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }
    setIsLoading(true)
    loadProject(id)
      .then((ok) => {
        if (!ok) {
          setError('Mandate not found')
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
    // Re-run only when the route id changes; loadProject/navigate are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">{error ?? 'Mandate not found'}</p>
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => navigate('/')}
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Editor />
    </ErrorBoundary>
  )
}
