import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PreviewRenderer } from '@/features/preview/PreviewRenderer'

export default function PreviewRoute() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // The export flag is passed as a query param appended to the hash route,
  // e.g. #/preview/<id>?export=1
  const isExport = React.useMemo(() => {
    const query = window.location.hash.split('?')[1] ?? ''
    return new URLSearchParams(query).get('export') === '1'
  }, [])

  if (!projectId) {
    return <div style={{ padding: 40 }}>No project specified.</div>
  }

  return (
    <div className="relative">
      {!isExport && (
        <button
          onClick={() => navigate(`/editor/${projectId}`)}
          className="fixed top-4 left-4 z-10 flex items-center gap-1.5 rounded-md bg-neutral-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to editor
        </button>
      )}
      <PreviewRenderer projectId={projectId} isExport={isExport} />
    </div>
  )
}
