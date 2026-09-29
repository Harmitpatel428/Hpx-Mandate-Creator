import * as React from 'react'

export function PageBreakBlock() {
  return (
    <div className="flex items-center gap-3 py-3 select-none">
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <span className="text-xs text-gray-400 font-medium uppercase tracking-widest shrink-0">Page Break</span>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </div>
  )
}
