import * as React from 'react'
import { Plus, Type, AlignLeft } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/stores/projectStore'
import { addSection } from 'shared/document-model/transforms'
import { generateId } from 'shared/utils/id'

export function EditorCanvas() {
  const document = useProjectStore((s) => s.document)
  const setDocument = useProjectStore((s) => s.setDocument)
  const setSaveState = useProjectStore((s) => s.setSaveState)

  const sections = document?.sections ?? []

  function handleAddSection() {
    if (!document) return
    const updated = addSection(document, { title: 'New Section' })
    setDocument(updated)
    setSaveState('unsaved')
  }

  function handleAddHeading(sectionId: string) {
    if (!document) return
    const section = document.sections.find((s) => s.id === sectionId)
    if (!section) return
    const block = { id: generateId(), type: 'heading' as const, level: 1 as const, content: 'Heading', hidden: false, locked: false, required: false }
    const updated = {
      ...document,
      sections: document.sections.map((s) =>
        s.id === sectionId ? { ...s, blocks: [...s.blocks, block] } : s,
      ),
    }
    setDocument(updated)
    setSaveState('unsaved')
  }

  function handleAddParagraph(sectionId: string) {
    if (!document) return
    const block = { id: generateId(), type: 'paragraph' as const, content: 'Enter text here…', hidden: false, locked: false, required: false }
    const updated = {
      ...document,
      sections: document.sections.map((s) =>
        s.id === sectionId ? { ...s, blocks: [...s.blocks, block] } : s,
      ),
    }
    setDocument(updated)
    setSaveState('unsaved')
  }

  return (
    <ScrollArea className="h-full bg-[hsl(0,0%,5%)]">
      <div className="flex flex-col items-center py-10 px-6 min-h-full">
        {/* A4 page simulation */}
        <div
          className="w-full max-w-2xl bg-white text-gray-900 shadow-xl rounded-sm"
          style={{ minHeight: '842px', padding: '64px 72px' }}
        >
          {/* Document title */}
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {document?.metadata.title ?? 'Untitled Mandate'}
            </h1>
            {document?.metadata.description && (
              <p className="mt-2 text-sm text-gray-500">{document.metadata.description}</p>
            )}
          </div>

          {/* Sections */}
          {sections.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-gray-400">This document has no sections yet.</p>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add first section
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, sIdx) => (
                <div key={section.id} className="group">
                  {/* Section header */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xs font-mono text-gray-400 w-6">{sIdx + 1}.</span>
                    <h2 className="text-base font-semibold text-gray-800">{section.title || 'Untitled Section'}</h2>
                  </div>

                  {/* Blocks */}
                  <div className="ml-8 space-y-2">
                    {section.blocks.map((block) => (
                      <div key={block.id} className="group/block">
                        {block.type === 'heading' && (
                          <p className="font-semibold text-gray-800">{block.content as string}</p>
                        )}
                        {block.type === 'paragraph' && (
                          <p className="text-sm text-gray-700 leading-relaxed">{block.content as string}</p>
                        )}
                      </div>
                    ))}

                    {/* Add block buttons */}
                    <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleAddHeading(section.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <Type className="h-3 w-3" />
                        Heading
                      </button>
                      <button
                        onClick={() => handleAddParagraph(section.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <AlignLeft className="h-3 w-3" />
                        Paragraph
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add section button */}
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSection}
            className="gap-2 border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add section
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
