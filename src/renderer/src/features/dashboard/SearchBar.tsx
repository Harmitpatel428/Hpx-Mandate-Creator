import * as React from 'react'
import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useUiStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearchQuery(value), 300)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="relative w-64">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder="Search mandates…"
        defaultValue={searchQuery}
        onChange={handleChange}
        className="pl-8 pr-8 h-8 text-xs"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => {
            setSearchQuery('')
            if (inputRef.current) inputRef.current.value = ''
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
