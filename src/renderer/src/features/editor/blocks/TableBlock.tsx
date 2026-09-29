import * as React from 'react'
import type { TableBlock as TableBlockType } from 'shared/document-model/types'
import { useProjectStore } from '@/stores/projectStore'
import { Plus } from 'lucide-react'
import { generateId } from 'shared/utils/id'

interface Props {
  block: TableBlockType
  sectionId: string
}

export function TableBlock({ block, sectionId }: Props) {
  const updateBlock = useProjectStore((s) => s.updateBlock)

  function updateCell(rowId: string, colId: string, value: string) {
    const rows = block.rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            cells: row.cells.some((c) => c.colId === colId)
              ? row.cells.map((c) => (c.colId === colId ? { ...c, content: value } : c))
              : [...row.cells, { colId, content: value }],
          }
        : row,
    )
    updateBlock(sectionId, block.id, { rows })
  }

  function addRow() {
    const newRow = {
      id: generateId(),
      cells: block.columns.map((col) => ({ colId: col.id, content: '' })),
    }
    updateBlock(sectionId, block.id, { rows: [...block.rows, newRow] })
  }

  function getCellContent(rowId: string, colId: string) {
    const row = block.rows.find((r) => r.id === rowId)
    return row?.cells.find((c) => c.colId === colId)?.content ?? ''
  }

  if (block.columns.length === 0) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
        No columns defined. Edit this block in the properties panel.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {block.columns.map((col) => (
              <th
                key={col.id}
                className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                style={col.width ? { width: `${col.width}%` } : undefined}
              >
                {col.header || 'Column'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rIdx) => (
            <tr key={row.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {block.columns.map((col) => (
                <td key={col.id} className="px-3 py-1.5 border-b border-gray-100">
                  <input
                    value={getCellContent(row.id, col.id)}
                    onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none focus:bg-blue-50/30 rounded px-1 -mx-1"
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="flex w-full items-center justify-center gap-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add row
      </button>
    </div>
  )
}
