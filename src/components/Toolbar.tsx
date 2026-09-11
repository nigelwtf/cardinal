import { useState } from "react"
import { useReactFlow } from "@xyflow/react"
import cardinalLogo from "@/assets/cardinal.png"
import {
  Check,
  ChevronDown,
  Cloud,
  Download,
  FileJson,
  FileText,
  FolderOpen,
  Image,
  LayoutGrid,
  Moon,
  Plus,
  Redo2,
  Sun,
  Undo2,
  Upload,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { download } from "@/lib/download"
import { toMermaid } from "@/lib/mermaid/serialize"
import { toSql } from "@/lib/sql/export"
import { useDiagram } from "@/store/useDiagram"
import { exportPng, exportSvg } from "./ImageExport"

interface ToolbarProps {
  onOpenLibrary: () => void
  onOpenImport: () => void
}

export function Toolbar({ onOpenLibrary, onOpenImport }: ToolbarProps) {
  const diagram = useDiagram((s) => s.diagram)
  const dirty = useDiagram((s) => s.dirty)
  const canUndo = useDiagram((s) => s.past.length > 0)
  const canRedo = useDiagram((s) => s.future.length > 0)
  const undo = useDiagram((s) => s.undo)
  const redo = useDiagram((s) => s.redo)
  const addTable = useDiagram((s) => s.addTable)
  const layout = useDiagram((s) => s.layout)
  const rename = useDiagram((s) => s.renameDiagram)
  const { resolvedTheme, setTheme } = useTheme()
  const { getNodes, fitView } = useReactFlow()
  const [editingName, setEditingName] = useState(false)

  const runLayout = (direction: "LR" | "TB") => {
    layout(direction)
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 20)
  }

  const exportImage = async (format: "png" | "svg") => {
    try {
      const options = {
        nodes: getNodes(),
        filename: `${diagram.name}.${format}`,
        dark: resolvedTheme === "dark",
      }
      await (format === "png" ? exportPng(options) : exportSvg(options))
      toast.success(`Exported ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-card px-3">
      <div className="flex items-center gap-2 pr-1">
        <img src={cardinalLogo} alt="" className="size-6 rounded-md" />
        <span className="text-sm font-semibold tracking-tight">Cardinal</span>
      </div>

      <Separator orientation="vertical" className="mx-1 !h-5" />

      {editingName ? (
        <Input
          autoFocus
          value={diagram.name}
          onChange={(e) => rename(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
          className="h-7 w-56 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingName(true)}
          className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {diagram.name}
        </button>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {dirty ? <Cloud className="size-3 animate-pulse" /> : <Check className="size-3 text-emerald-500" />}
          </span>
        </TooltipTrigger>
        <TooltipContent>{dirty ? "Saving to IndexedDB…" : "Saved locally"}</TooltipContent>
      </Tooltip>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" disabled={!canUndo} onClick={undo}>
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo ⌘Z</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" disabled={!canRedo} onClick={redo}>
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo ⇧⌘Z</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 !h-5" />

        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => addTable()}>
          <Plus className="size-3.5" /> Table
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
              <LayoutGrid className="size-3.5" /> Layout <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => runLayout("LR")}>Left to right</DropdownMenuItem>
            <DropdownMenuItem onClick={() => runLayout("TB")}>Top to bottom</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fitView({ padding: 0.2, duration: 300 })}>Fit to screen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={onOpenImport}>
          <Upload className="size-3.5" /> Import
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
              <Download className="size-3.5" /> Export <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportImage("png")}>
              <Image className="size-3.5" /> PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportImage("svg")}>
              <Image className="size-3.5" /> SVG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => download(`${diagram.name}.mmd`, toMermaid(diagram))}>
              <FileText className="size-3.5" /> Mermaid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => download(`${diagram.name}.sql`, toSql(diagram, "postgres"))}>
              <FileText className="size-3.5" /> PostgreSQL DDL
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                download(`${diagram.name}.cardinal.json`, JSON.stringify(diagram, null, 2), "application/json")
              }
            >
              <FileJson className="size-3.5" /> Cardinal JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={onOpenLibrary}>
          <FolderOpen className="size-3.5" /> Library
        </Button>

        <Separator orientation="vertical" className="mx-1 !h-5" />

        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </div>
    </header>
  )
}
