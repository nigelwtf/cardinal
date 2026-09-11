import { useReactFlow } from "@xyflow/react"
import { Download, FolderOpen, LayoutGrid, Moon, Plus, Sun, Table2, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { download } from "@/lib/download"
import { NODE_WIDTH, tableHeight } from "@/lib/layout"
import { toMermaid } from "@/lib/mermaid/serialize"
import { toSql } from "@/lib/sql/export"
import { useDiagram } from "@/store/useDiagram"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenLibrary: () => void
  onOpenImport: () => void
}

export function CommandPalette({ open, onOpenChange, onOpenLibrary, onOpenImport }: Props) {
  const diagram = useDiagram((s) => s.diagram)
  const addTable = useDiagram((s) => s.addTable)
  const layout = useDiagram((s) => s.layout)
  const select = useDiagram((s) => s.select)
  const { setTheme, resolvedTheme } = useTheme()
  const { fitView, setCenter } = useReactFlow()

  const run = (fn: () => void) => () => {
    onOpenChange(false)
    fn()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Search tables and actions">
      <CommandInput placeholder="Jump to a table or run a command…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={run(() => addTable())}>
            <Plus /> New table
          </CommandItem>
          <CommandItem
            onSelect={run(() => {
              layout("LR")
              setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 20)
            })}
          >
            <LayoutGrid /> Auto layout
          </CommandItem>
          <CommandItem onSelect={run(() => fitView({ padding: 0.2, duration: 300 }))}>
            <LayoutGrid /> Fit to screen
          </CommandItem>
          <CommandItem onSelect={run(onOpenImport)}>
            <Upload /> Import schema
          </CommandItem>
          <CommandItem onSelect={run(onOpenLibrary)}>
            <FolderOpen /> Open library
          </CommandItem>
          <CommandItem onSelect={run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
            {resolvedTheme === "dark" ? <Sun /> : <Moon />} Toggle theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Export">
          <CommandItem onSelect={run(() => download(`${diagram.name}.mmd`, toMermaid(diagram)))}>
            <Download /> Mermaid source
          </CommandItem>
          <CommandItem onSelect={run(() => download(`${diagram.name}.sql`, toSql(diagram, "postgres")))}>
            <Download /> PostgreSQL DDL
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tables">
          {diagram.tables.map((table) => (
            <CommandItem
              key={table.id}
              value={`${table.name} ${table.columns.map((c) => c.name).join(" ")}`}
              onSelect={run(() => {
                select({ kind: "table", id: table.id })
                setCenter(table.position.x + NODE_WIDTH / 2, table.position.y + tableHeight(table) / 2, {
                  zoom: 1,
                  duration: 350,
                })
              })}
            >
              <Table2 /> {table.name}
              <span className="ml-auto text-[10px] text-muted-foreground">{table.columns.length} cols</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
