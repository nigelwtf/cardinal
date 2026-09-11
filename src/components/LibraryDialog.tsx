import { useEffect, useState } from "react"
import { useReactFlow } from "@xyflow/react"
import { FileStack, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { deleteDiagram, listDiagrams, loadDiagram, rememberLastOpened, type DiagramSummary } from "@/lib/persistence"
import { emptyDiagram, seededDiagram } from "@/lib/sample"
import type { Diagram } from "@/lib/types"
import { useDiagram } from "@/store/useDiagram"

const relative = (timestamp: number) => {
  const minutes = Math.round((Date.now() - timestamp) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function LibraryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const currentId = useDiagram((s) => s.diagram.id)
  const replaceDiagram = useDiagram((s) => s.replaceDiagram)
  const [items, setItems] = useState<DiagramSummary[]>([])
  const { fitView } = useReactFlow()

  const refresh = () => listDiagrams().then(setItems)

  useEffect(() => {
    if (open) void refresh()
  }, [open])

  const open_ = (diagram: Diagram) => {
    replaceDiagram(diagram)
    rememberLastOpened(diagram.id)
    onOpenChange(false)
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
          <DialogDescription>Everything is stored locally in IndexedDB.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => open_(emptyDiagram())}>
            <Plus className="size-3.5" /> Blank schema
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => open_(seededDiagram())}>
            <Sparkles className="size-3.5" /> Sample schema
          </Button>
        </div>

        <ScrollArea className="max-h-80">
          <div className="space-y-1 pr-2">
            {items.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">Nothing saved yet.</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-accent/60",
                  item.id === currentId ? "border-primary/50 bg-primary/5" : "border-border/60",
                )}
                onClick={async () => {
                  const diagram = await loadDiagram(item.id)
                  if (diagram) open_(diagram)
                }}
              >
                <FileStack className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.tableCount} tables · {relative(item.updatedAt)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  onClick={async (event) => {
                    event.stopPropagation()
                    await deleteDiagram(item.id)
                    await refresh()
                    toast.success(`Deleted ${item.name}`)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
