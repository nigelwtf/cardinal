import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { AlertTriangle, Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toMermaid } from "@/lib/mermaid/serialize"
import { toSql, type Dialect } from "@/lib/sql/export"
import { download } from "@/lib/download"
import { useDiagram } from "@/store/useDiagram"

function CopyButton({ getValue, label = "Copy" }: { getValue: () => string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(getValue())
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : label}
    </Button>
  )
}

function MermaidEditor() {
  const diagram = useDiagram((s) => s.diagram)
  const applyMermaid = useDiagram((s) => s.applyMermaid)
  const parseErrors = useDiagram((s) => s.parseErrors)
  const generated = useMemo(() => toMermaid(diagram), [diagram])
  const [draft, setDraft] = useState(generated)
  const editing = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!editing.current) setDraft(generated)
  }, [generated])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onChange = (value: string) => {
    setDraft(value)
    editing.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(() => applyMermaid(value), 500)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
        <span className="text-[11px] text-muted-foreground">Edit here to change the diagram</span>
        <div className="ml-auto flex items-center">
          <CopyButton getValue={() => draft} />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => download(`${diagram.name}.mmd`, draft, "text/plain")}
          >
            <Download className="size-3" /> .mmd
          </Button>
        </div>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          // Reformatting mid-keystroke would fight the caret, so normalise on blur.
          clearTimeout(timer.current)
          applyMermaid(draft)
          editing.current = false
        }}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-[11px] leading-relaxed focus-visible:ring-0"
      />
      {parseErrors.length > 0 && (
        <div className="max-h-24 shrink-0 overflow-auto border-t bg-destructive/10 p-2 text-[11px] text-destructive">
          {parseErrors.map((error) => (
            <div key={`${error.line}-${error.message}`} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              <span>
                Line {error.line}: {error.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SqlView() {
  const diagram = useDiagram((s) => s.diagram)
  const [dialect, setDialect] = useState<Dialect>("postgres")
  const sql = useMemo(() => toSql(diagram, dialect), [diagram, dialect])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b px-2">
        <Select value={dialect} onValueChange={(v) => setDialect(v as Dialect)}>
          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="postgres" className="text-xs">PostgreSQL</SelectItem>
            <SelectItem value="mysql" className="text-xs">MySQL</SelectItem>
            <SelectItem value="sqlite" className="text-xs">SQLite</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center">
          <CopyButton getValue={() => sql} />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => download(`${diagram.name}.sql`, sql, "text/plain")}
          >
            <Download className="size-3" /> .sql
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <pre className="p-3 font-mono text-[11px] leading-relaxed">{sql}</pre>
      </ScrollArea>
    </div>
  )
}

function MermaidPreview({ active }: { active: boolean }) {
  const diagram = useDiagram((s) => s.diagram)
  const { resolvedTheme } = useTheme()
  const source = useMemo(() => toMermaid(diagram), [diagram])
  const [svg, setSvg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    // Mermaid is heavy; only pull it in when the preview is actually opened.
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "default",
        securityLevel: "strict",
        er: { useMaxWidth: true },
      })
      try {
        const { svg: rendered } = await mermaid.render(`cardinal-preview-${Math.abs(hash(source))}`, source)
        if (cancelled) return
        setSvg(rendered)
        setError(null)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      }
    })
    return () => {
      cancelled = true
    }
  }, [active, source, resolvedTheme])

  if (error) {
    return <div className="p-3 text-xs text-destructive">Mermaid could not render this diagram: {error}</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
    </ScrollArea>
  )
}

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0
  return h
}

export function CodePanel() {
  const diagram = useDiagram((s) => s.diagram)
  const [tab, setTab] = useState("mermaid")

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col gap-0 bg-card">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-2">
        <TabsList className="h-7">
          <TabsTrigger value="mermaid" className="h-6 px-2.5 text-xs">Mermaid</TabsTrigger>
          <TabsTrigger value="sql" className="h-6 px-2.5 text-xs">SQL</TabsTrigger>
          <TabsTrigger value="preview" className="h-6 px-2.5 text-xs">Preview</TabsTrigger>
          <TabsTrigger value="json" className="h-6 px-2.5 text-xs">JSON</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="mermaid" className="min-h-0 flex-1 outline-none"><MermaidEditor /></TabsContent>
      <TabsContent value="sql" className="min-h-0 flex-1 outline-none"><SqlView /></TabsContent>
      <TabsContent value="preview" className="min-h-0 flex-1 outline-none">
        <MermaidPreview active={tab === "preview"} />
      </TabsContent>
      <TabsContent value="json" className="min-h-0 flex-1 outline-none">
        <div className="flex h-full flex-col">
          <div className="flex h-9 shrink-0 items-center border-b px-2">
            <span className="text-[11px] text-muted-foreground">Full document, safe to version control</span>
            <div className="ml-auto flex items-center">
              <CopyButton getValue={() => JSON.stringify(diagram, null, 2)} />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs"
                onClick={() => {
                  download(`${diagram.name}.cardinal.json`, JSON.stringify(diagram, null, 2), "application/json")
                  toast.success("Exported document")
                }}
              >
                <Download className="size-3" /> .json
              </Button>
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <pre className="p-3 font-mono text-[10px] leading-relaxed">{JSON.stringify(diagram, null, 2)}</pre>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  )
}
