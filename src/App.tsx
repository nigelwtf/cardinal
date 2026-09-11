import { useEffect, useMemo, useRef, useState } from "react"
import { ReactFlowProvider, useReactFlow } from "@xyflow/react"
import { ThemeProvider } from "next-themes"
import { Canvas } from "@/components/canvas/Canvas"
import { CommandPalette } from "@/components/CommandPalette"
import { ImportDialog } from "@/components/ImportDialog"
import { LibraryDialog } from "@/components/LibraryDialog"
import { Toolbar } from "@/components/Toolbar"
import { CodePanel } from "@/components/panels/CodePanel"
import { Explorer } from "@/components/panels/Explorer"
import { Inspector } from "@/components/panels/Inspector"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { dispatchKeymap, type KeyBinding } from "@/lib/keymap"
import { getLastOpened, loadDiagram, rememberLastOpened, saveDiagram } from "@/lib/persistence"
import { seededDiagram } from "@/lib/sample"
import { useDiagram } from "@/store/useDiagram"

function Workspace() {
  const diagram = useDiagram((s) => s.diagram)
  const dirty = useDiagram((s) => s.dirty)
  const markSaved = useDiagram((s) => s.markSaved)
  const replaceDiagram = useDiagram((s) => s.replaceDiagram)
  const addTable = useDiagram((s) => s.addTable)
  const layout = useDiagram((s) => s.layout)
  const undo = useDiagram((s) => s.undo)
  const redo = useDiagram((s) => s.redo)
  const select = useDiagram((s) => s.select)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const hydrated = useRef(false)
  const { fitView } = useReactFlow()

  // Restore the last session, falling back to a worked example.
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const last = getLastOpened()
    const restore = async () => {
      const saved = last ? await loadDiagram(last) : undefined
      replaceDiagram(saved ?? seededDiagram())
      setTimeout(() => fitView({ padding: 0.15, duration: 300, maxZoom: 1 }), 80)
    }
    void restore()
  }, [fitView, replaceDiagram])

  // Debounced persistence to IndexedDB.
  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(async () => {
      await saveDiagram(diagram)
      rememberLastOpened(diagram.id)
      markSaved()
    }, 600)
    return () => clearTimeout(timer)
  }, [diagram, dirty, markSaved])

  const keymap = useMemo<KeyBinding[]>(
    () => [
      { key: "k", mod: true, allowWhileTyping: true, run: () => setPaletteOpen((open) => !open) },
      { key: "z", mod: true, run: () => undo() },
      { key: "z", mod: true, shift: true, run: () => redo() },
      { key: "n", run: () => addTable() },
      { key: "l", run: () => layout("LR") },
      { key: "Escape", preventDefault: false, run: () => select({ kind: "none" }) },
    ],
    [addTable, layout, redo, select, undo],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => dispatchKeymap(keymap, event)
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [keymap])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar onOpenLibrary={() => setLibraryOpen(true)} onOpenImport={() => setImportOpen(true)} />

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="16" minSize="12" maxSize="28">
          <Explorer />
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="60" minSize="30">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="64" minSize="25">
              <Canvas />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="36" minSize="15" collapsible>
              <CodePanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="24" minSize="16" maxSize="38">
          <Inspector />
        </ResizablePanel>
      </ResizablePanelGroup>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenImport={() => setImportOpen(true)}
      />
      <LibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <Toaster position="bottom-center" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <ReactFlowProvider>
          <Workspace />
        </ReactFlowProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
