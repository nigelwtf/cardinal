import { useMemo, useState } from "react"
import { useReactFlow } from "@xyflow/react"
import { ChevronRight, KeyRound, Link2, Plus, Search, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { NODE_WIDTH, tableHeight } from "@/lib/layout"
import { useDiagram } from "@/store/useDiagram"

export function Explorer() {
  const tables = useDiagram((s) => s.diagram.tables)
  const relationships = useDiagram((s) => s.diagram.relationships)
  const selection = useDiagram((s) => s.selection)
  const select = useDiagram((s) => s.select)
  const addTable = useDiagram((s) => s.addTable)
  const { setCenter } = useReactFlow()
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tables
    return tables.filter(
      (t) => t.name.toLowerCase().includes(q) || t.columns.some((c) => c.name.toLowerCase().includes(q)),
    )
  }, [query, tables])

  const focus = (id: string) => {
    const table = tables.find((t) => t.id === id)
    select({ kind: "table", id })
    if (table) {
      setCenter(table.position.x + NODE_WIDTH / 2, table.position.y + tableHeight(table) / 2, {
        zoom: 1,
        duration: 350,
      })
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tables</span>
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{tables.length}</span>
        <Button size="icon" variant="ghost" className="ml-auto size-6" onClick={() => addTable()} title="New table">
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables & columns"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-1.5">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {tables.length ? "No matches" : "No tables yet"}
            </p>
          )}
          {filtered.map((table) => {
            const isOpen = expanded[table.id]
            const degree = relationships.filter(
              (r) => r.sourceTableId === table.id || r.targetTableId === table.id,
            ).length
            return (
              <div key={table.id}>
                <div
                  className={cn(
                    "group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors",
                    selection.kind === "table" && selection.id === table.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60",
                  )}
                  onClick={() => focus(table.id)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded((prev) => ({ ...prev, [table.id]: !prev[table.id] }))
                    }}
                    className="flex size-4 shrink-0 items-center justify-center rounded hover:bg-background/60"
                  >
                    <ChevronRight className={cn("size-3 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: table.accent }} />
                  <Table2 className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{table.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {degree ? `${degree}↔` : ""}
                  </span>
                </div>
                {isOpen && (
                  <div className="ml-6 border-l border-border/60 pl-2">
                    {table.columns.map((column) => (
                      <div key={column.id} className="flex items-center gap-1.5 py-0.5 text-[11px]">
                        {column.pk ? (
                          <KeyRound className="size-2.5 shrink-0 text-amber-500" />
                        ) : column.fk ? (
                          <Link2 className="size-2.5 shrink-0 text-sky-500" />
                        ) : (
                          <span className="size-2.5 shrink-0" />
                        )}
                        <span className="truncate">{column.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground">
                          {column.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
