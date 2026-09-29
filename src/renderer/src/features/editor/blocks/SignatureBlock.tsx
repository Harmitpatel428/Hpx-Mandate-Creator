import * as React from 'react'
import type { SignatureBlock as SignatureBlockType } from 'shared/document-model/types'
import { PenLine } from 'lucide-react'

interface Props {
  block: SignatureBlockType
}

export function SignatureBlock({ block }: Props) {
  return (
    <div className="border border-dashed border-gray-300 rounded-md p-4 space-y-3 bg-gray-50/50">
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
        <PenLine className="h-3.5 w-3.5" />
        Signature Block
      </div>

      <div className="space-y-2">
        {/* Signature line */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="border-b border-gray-400 h-8" />
            <p className="text-xs text-gray-500 mt-1">Signature</p>
          </div>
          {block.showDateLine && (
            <div className="w-36">
              <div className="border-b border-gray-400 h-8" />
              <p className="text-xs text-gray-500 mt-1">Date</p>
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-medium text-gray-800">
            {block.signatoryName || <span className="text-gray-400 italic">Signatory Name</span>}
          </p>
          {block.signatoryTitle && (
            <p className="text-xs text-gray-500">{block.signatoryTitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
