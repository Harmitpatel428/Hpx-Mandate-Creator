import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectStore } from '@/stores/projectStore'
import { useUiStore } from '@/stores/uiStore'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Layers, Square, Info } from 'lucide-react'
import { formatDate } from 'shared/utils/format'
import { PROJECT_STATUS_LABELS, type Block, type Section } from 'shared/document-model/types'

// ---- Document-level properties ----

function DocumentProperties() {
  const document = useProjectStore((s) => s.document)
  const patchDocument = useProjectStore((s) => s.patchDocument)

  if (!document) return null
  const m = document.metadata

  function patchMeta(patch: object) {
    patchDocument({ metadata: { ...document!.metadata, ...patch } })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</p>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Author</Label>
          <Input
            value={m.author}
            onChange={(e) => patchMeta({ author: e.target.value })}
            className="h-7 text-xs"
            placeholder="Name"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Organization</Label>
          <Input
            value={m.organization}
            onChange={(e) => patchMeta({ organization: e.target.value })}
            className="h-7 text-xs"
            placeholder="Company"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={m.status}
            onValueChange={(v) => patchMeta({ status: v })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Effective Date</Label>
          <Input
            type="date"
            value={m.effectiveDate ?? ''}
            onChange={(e) => patchMeta({ effectiveDate: e.target.value || null })}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Document #</Label>
          <Input
            value={m.documentNumber}
            onChange={(e) => patchMeta({ documentNumber: e.target.value })}
            className="h-7 text-xs"
            placeholder="REF-001"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Confidentiality</Label>
          <Select
            value={m.confidentiality}
            onValueChange={(v) => patchMeta({ confidentiality: v })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public" className="text-xs">Public</SelectItem>
              <SelectItem value="internal" className="text-xs">Internal</SelectItem>
              <SelectItem value="confidential" className="text-xs">Confidential</SelectItem>
              <SelectItem value="strictly_confidential" className="text-xs">Strictly Confidential</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-1 text-xs">
        <PropertyRow label="Sections" value={String(document.sections.length)} />
        <PropertyRow label="Variables" value={String(document.variables.length)} />
        <PropertyRow label="Page size" value={document.pageSettings.pageSize} />
      </div>
    </div>
  )
}

// ---- Section-level properties ----

function SectionProperties({ section }: { section: Section }) {
  const updateSection = useProjectStore((s) => s.updateSection)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section</p>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            className="h-7 text-xs"
            placeholder="Section title"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Numbering</Label>
          <Switch
            checked={section.numbering}
            onCheckedChange={(v) => updateSection(section.id, { numbering: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Hidden</Label>
          <Switch
            checked={section.hidden}
            onCheckedChange={(v) => updateSection(section.id, { hidden: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Locked</Label>
          <Switch
            checked={section.locked}
            onCheckedChange={(v) => updateSection(section.id, { locked: v })}
          />
        </div>
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground">
        {section.blocks.length} block{section.blocks.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ---- Block-level properties ----

function BlockProperties({ block, sectionId }: { block: Block; sectionId: string }) {
  const updateBlock = useProjectStore((s) => s.updateBlock)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Square className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {block.type} block
        </p>
      </div>

      <div className="space-y-2">
        {/* Heading level */}
        {block.type === 'heading' && (
          <div className="space-y-1">
            <Label className="text-xs">Level</Label>
            <Select
              value={String(block.level)}
              onValueChange={(v) => updateBlock(sectionId, block.id, { level: Number(v) as 1 | 2 | 3 })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-xs">H1 — Large</SelectItem>
                <SelectItem value="2" className="text-xs">H2 — Medium</SelectItem>
                <SelectItem value="3" className="text-xs">H3 — Small</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Note type */}
        {block.type === 'note' && (
          <div className="space-y-1">
            <Label className="text-xs">Note type</Label>
            <Select
              value={block.noteType}
              onValueChange={(v) => updateBlock(sectionId, block.id, { noteType: v as 'info' | 'warning' | 'internal' })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info" className="text-xs">Info</SelectItem>
                <SelectItem value="warning" className="text-xs">Warning</SelectItem>
                <SelectItem value="internal" className="text-xs">Internal only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Signature fields */}
        {block.type === 'signature' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Signatory name</Label>
              <Input
                value={block.signatoryName}
                onChange={(e) => updateBlock(sectionId, block.id, { signatoryName: e.target.value })}
                className="h-7 text-xs"
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title / Role</Label>
              <Input
                value={block.signatoryTitle}
                onChange={(e) => updateBlock(sectionId, block.id, { signatoryTitle: e.target.value })}
                className="h-7 text-xs"
                placeholder="Managing Director"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show date line</Label>
              <Switch
                checked={block.showDateLine}
                onCheckedChange={(v) => updateBlock(sectionId, block.id, { showDateLine: v })}
              />
            </div>
          </>
        )}

        {/* Common flags */}
        <Separator />

        <div className="flex items-center justify-between">
          <Label className="text-xs">Hidden</Label>
          <Switch
            checked={block.hidden}
            onCheckedChange={(v) => updateBlock(sectionId, block.id, { hidden: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Locked</Label>
          <Switch
            checked={block.locked}
            onCheckedChange={(v) => updateBlock(sectionId, block.id, { locked: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Required</Label>
          <Switch
            checked={block.required}
            onCheckedChange={(v) => updateBlock(sectionId, block.id, { required: v })}
          />
        </div>
      </div>
    </div>
  )
}

// ---- Right Panel root ----

export function EditorRightPanel() {
  const document = useProjectStore((s) => s.document)
  const { activeBlockId, activeSectionId } = useUiStore()

  const activeSection = activeSectionId
    ? document?.sections.find((s) => s.id === activeSectionId) ?? null
    : null

  const activeBlock = activeBlockId
    ? document?.sections
        .flatMap((s) => s.blocks.map((b) => ({ block: b, sectionId: s.id })))
        .find(({ block }) => block.id === activeBlockId) ?? null
    : null

  if (!document) {
    return (
      <div className="h-full border-l border-border bg-sidebar flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">No document loaded</p>
      </div>
    )
  }

  return (
    <div className="h-full border-l border-border bg-sidebar">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {activeBlock ? (
            <BlockProperties block={activeBlock.block} sectionId={activeBlock.sectionId} />
          ) : activeSection ? (
            <>
              <SectionProperties section={activeSection} />
              <Separator />
              <DocumentProperties />
            </>
          ) : (
            <>
              <DocumentProperties />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Click a block to see its properties</span>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right truncate max-w-[120px]">{value}</span>
    </div>
  )
}
