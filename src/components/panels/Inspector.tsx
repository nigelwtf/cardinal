import { ArrowDown, ArrowUp, Copy, Plus, Spline, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CARDINALITY_LABEL } from "@/lib/mermaid/tokens"
import { ACCENTS, COMMON_TYPES, type Cardinality, type Column } from "@/lib/types"
import { useDiagram } from "@/store/useDiagram"

const CARDINALITIES: Cardinality[] = ["one", "zero-or-one", "one-or-more", "zero-or-more"]

function Flag({
  active,
  label,
  hint,
  onClick,
  className,
}: {
  active: boolean
  label: string
  hint: string
  onClick: () => void
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "h-6 rounded-md border px-1.5 font-mono text-[10px] font-semibold uppercase transition-colors",
            active
              ? cn("border-transparent text-white", className ?? "bg-primary")
              : "border-border bg-transparent text-muted-foreground hover:bg-accent",
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

function ColumnRow({ tableId, column, index, total }: { tableId: string; column: Column; index: number; total: number }) {
  const updateColumn = useDiagram((s) => s.updateColumn)
  const removeColumn = useDiagram((s) => s.removeColumn)
  const reorderColumn = useDiagram((s) => s.reorderColumn)

  return (
    <div className="group rounded-lg border border-border/60 bg-muted/20 p-2">
      <div className="flex items-center gap-1.5">
        <Input
          value={column.name}
          onChange={(e) => updateColumn(tableId, column.id, { name: e.target.value })}
          className="h-7 flex-1 text-xs"
          placeholder="column_name"
        />
        <Input
          value={column.type}
          list="cardinal-types"
          onChange={(e) => updateColumn(tableId, column.id, { type: e.target.value })}
          className="h-7 w-24 font-mono text-[11px]"
          placeholder="type"
        />
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <Flag
          active={column.pk}
          label="pk"
          hint="Primary key"
          className="bg-amber-500"
          onClick={() => updateColumn(tableId, column.id, { pk: !column.pk })}
        />
        <Flag
          active={column.fk}
          label="fk"
          hint="Foreign key"
          className="bg-sky-500"
          onClick={() => updateColumn(tableId, column.id, { fk: !column.fk })}
        />
        <Flag
          active={column.uk}
          label="uk"
          hint="Unique"
          className="bg-violet-500"
          onClick={() => updateColumn(tableId, column.id, { uk: !column.uk })}
        />
        <Flag
          active={column.nullable}
          label="null"
          hint={column.pk ? "Primary keys are never nullable" : "Nullable"}
          className="bg-zinc-500"
          onClick={() => !column.pk && updateColumn(tableId, column.id, { nullable: !column.nullable })}
        />
        <div className="ml-auto flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={index === 0}
            onClick={() => reorderColumn(tableId, column.id, -1)}
          >
            <ArrowUp className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            disabled={index === total - 1}
            onClick={() => reorderColumn(tableId, column.id, 1)}
          >
            <ArrowDown className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeColumn(tableId, column.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      <Input
        value={column.defaultValue ?? ""}
        onChange={(e) => updateColumn(tableId, column.id, { defaultValue: e.target.value || undefined })}
        className="mt-1.5 h-6 font-mono text-[10px]"
        placeholder="default value"
      />
    </div>
  )
}

function TableInspector({ id }: { id: string }) {
  const table = useDiagram((s) => s.diagram.tables.find((t) => t.id === id))
  const updateTable = useDiagram((s) => s.updateTable)
  const addColumn = useDiagram((s) => s.addColumn)
  const removeTable = useDiagram((s) => s.removeTable)
  const duplicateTable = useDiagram((s) => s.duplicateTable)

  if (!table) return null

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Table name</Label>
        <Input value={table.name} onChange={(e) => updateTable(table.id, { name: e.target.value })} className="h-8" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={table.comment ?? ""}
          onChange={(e) => updateTable(table.id, { comment: e.target.value || undefined })}
          placeholder="What lives in this table?"
          className="min-h-[56px] resize-none text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Accent</Label>
        <div className="flex flex-wrap gap-1.5">
          {ACCENTS.map((accent) => (
            <button
              key={accent}
              type="button"
              aria-label={`Accent ${accent}`}
              onClick={() => updateTable(table.id, { accent })}
              style={{ background: accent }}
              className={cn(
                "size-5 rounded-full ring-offset-2 ring-offset-background transition-all",
                table.accent === accent ? "ring-2 ring-foreground" : "hover:scale-110",
              )}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Columns ({table.columns.length})</Label>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => addColumn(table.id)}>
          <Plus className="size-3" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {table.columns.map((column, index) => (
          <ColumnRow key={column.id} tableId={table.id} column={column} index={index} total={table.columns.length} />
        ))}
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => duplicateTable(table.id)}>
          <Copy className="size-3.5" /> Duplicate
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:text-destructive" onClick={() => removeTable(table.id)}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  )
}

function RelationshipInspector({ id }: { id: string }) {
  const relationship = useDiagram((s) => s.diagram.relationships.find((r) => r.id === id))
  const tables = useDiagram((s) => s.diagram.tables)
  const update = useDiagram((s) => s.updateRelationship)
  const remove = useDiagram((s) => s.removeRelationship)

  if (!relationship) return null
  const source = tables.find((t) => t.id === relationship.sourceTableId)
  const target = tables.find((t) => t.id === relationship.targetTableId)

  const endpoint = (side: "source" | "target") => {
    const table = side === "source" ? source : target
    const tableKey = side === "source" ? "sourceTableId" : "targetTableId"
    const columnKey = side === "source" ? "sourceColumnId" : "targetColumnId"
    const cardinalityKey = side === "source" ? "sourceCardinality" : "targetCardinality"

    return (
      <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{side}</Label>
        <Select value={relationship[tableKey]} onValueChange={(value) => update(id, { [tableKey]: value, [columnKey]: undefined })}>
          <SelectTrigger className="h-7 w-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={relationship[columnKey] ?? "__none"}
          onValueChange={(value) => update(id, { [columnKey]: value === "__none" ? undefined : value })}
        >
          <SelectTrigger className="h-7 w-full text-xs"><SelectValue placeholder="Anchor column" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none" className="text-xs">Whole table</SelectItem>
            {table?.columns.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={relationship[cardinalityKey]} onValueChange={(value) => update(id, { [cardinalityKey]: value as Cardinality })}>
          <SelectTrigger className="h-7 w-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CARDINALITIES.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">{CARDINALITY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Label</Label>
        <Input value={relationship.label} onChange={(e) => update(id, { label: e.target.value })} className="h-8" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {endpoint("source")}
        {endpoint("target")}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2">
        <div>
          <Label className="text-xs">Identifying</Label>
          <p className="text-[10px] text-muted-foreground">Solid line, child depends on parent</p>
        </div>
        <Switch checked={relationship.identifying} onCheckedChange={(v) => update(id, { identifying: v })} />
      </div>

      {relationship.waypoints?.length ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => update(id, { waypoints: undefined })}
        >
          <Spline className="size-3.5" /> Straighten line ({relationship.waypoints.length})
        </Button>
      ) : null}

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={() => remove(id)}>
        <Trash2 className="size-3.5" /> Delete relationship
      </Button>
    </div>
  )
}

function DiagramInspector() {
  const diagram = useDiagram((s) => s.diagram)
  const rename = useDiagram((s) => s.renameDiagram)

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Schema name</Label>
        <Input value={diagram.name} onChange={(e) => rename(e.target.value)} className="h-8" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="text-xl font-semibold tabular-nums">{diagram.tables.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tables</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="text-xl font-semibold tabular-nums">{diagram.relationships.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Relations</div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Shortcuts</p>
        {[
          ["⌘K", "Command palette"],
          ["N", "New table"],
          ["L", "Auto layout"],
          ["⌘Z / ⇧⌘Z", "Undo / redo"],
          ["Double-click", "New table on canvas"],
          ["Drag a column edge", "Create a relationship"],
          ["Hover", "Show a line's bend handles"],
          ["Drag a dot", "Add or move a bend"],
          ["Double-click a dot", "Remove a bend"],
          ["⌥ while dragging", "Bend off-grid"],
          ["Drag a line end", "Re-point a relationship"],
        ].map(([keys, description]) => (
          <div key={keys} className="flex items-center justify-between gap-3">
            <span>{description}</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{keys}</kbd>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Inspector() {
  const selection = useDiagram((s) => s.selection)

  return (
    <div className="flex h-full flex-col bg-card">
      <datalist id="cardinal-types">
        {COMMON_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <div className="flex h-10 shrink-0 items-center border-b px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {selection.kind === "table" ? "Table" : selection.kind === "relationship" ? "Relationship" : "Schema"}
      </div>
      <ScrollArea className="flex-1">
        {selection.kind === "table" ? (
          <TableInspector id={selection.id} />
        ) : selection.kind === "relationship" ? (
          <RelationshipInspector id={selection.id} />
        ) : (
          <DiagramInspector />
        )}
      </ScrollArea>
    </div>
  )
}
