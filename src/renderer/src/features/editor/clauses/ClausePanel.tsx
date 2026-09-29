import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Trash2, Library, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClauseInsertModal } from './ClauseInsertModal'
import { CLAUSE_CATEGORIES, type ClauseRecord } from 'shared/document-model/library'

const ALL = '__all__'

export function ClausePanel() {
  const [clauses, setClauses] = useState<ClauseRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>(ALL)
  const [insertTarget, setInsertTarget] = useState<ClauseRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClauseRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.clauses.list({
        search: search || undefined,
        category: category === ALL ? undefined : category,
      })
      if (res.success) setClauses(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  async function confirmDelete() {
    if (!deleteTarget) return
    const res = await window.electronAPI.clauses.delete({ id: deleteTarget.id })
    if (res.success) setClauses((cs) => cs.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clause Library</p>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clauses…"
          className="h-8 pl-7 text-xs"
        />
      </div>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {CLAUSE_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && clauses.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : clauses.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 pt-6 text-center">
          <Library className="h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">No clauses found</p>
          <p className="text-[10px] text-muted-foreground/50">Save a section or block as a clause to reuse it.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {clauses.map((c) => (
            <div key={c.id} className="group/clause rounded border border-border/60 p-2 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground/90 truncate">
                    {c.name}
                    {c.isSample && <span className="ml-1 rounded bg-primary/15 text-primary px-1 py-px text-[9px] uppercase tracking-wide">Sample</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.category}</p>
                </div>
                <button
                  className="opacity-0 group-hover/clause:opacity-100 shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                  onClick={() => setDeleteTarget(c)}
                  title="Delete clause"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {c.description && <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">{c.description}</p>}
              <button
                onClick={() => setInsertTarget(c)}
                className="flex items-center gap-1 mt-1.5 text-[10px] text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Insert into document
              </button>
            </div>
          ))}
        </div>
      )}

      <ClauseInsertModal open={!!insertTarget} onClose={() => setInsertTarget(null)} clause={insertTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete clause?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed from the clause library.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
