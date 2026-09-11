import { useState } from "react"
import { useReactFlow } from "@xyflow/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { newId } from "@/lib/id"
import { autoLayout } from "@/lib/layout"
import { parseMermaid } from "@/lib/mermaid/parse"
import { normalizeDiagram } from "@/lib/normalize"
import { parseSql } from "@/lib/sql/import"
import type { Diagram } from "@/lib/types"
import { useDiagram } from "@/store/useDiagram"

const PLACEHOLDERS: Record<string, string> = {
  mermaid: "erDiagram\n    CREW_MEMBER ||--o{ DELIVERY : performs\n    CREW_MEMBER {\n        uuid id PK\n        string name\n    }",
  sql: "CREATE TABLE crew_member (\n  id uuid PRIMARY KEY,\n  name text NOT NULL\n);",
  json: '{ "name": "My schema", "tables": [], "relationships": [] }',
}

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const replaceDiagram = useDiagram((s) => s.replaceDiagram)
  const [tab, setTab] = useState("mermaid")
  const [text, setText] = useState("")
  const { fitView } = useReactFlow()

  const commit = (diagram: Diagram, message: string) => {
    replaceDiagram(diagram)
    onOpenChange(false)
    setText("")
    toast.success(message)
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50)
  }

  const handleImport = () => {
    if (!text.trim()) return
    try {
      if (tab === "json") {
        const parsed = JSON.parse(text) as Partial<Diagram>
        if (!Array.isArray(parsed.tables)) throw new Error("Missing a `tables` array")
        commit(
          normalizeDiagram({
            id: parsed.id ?? newId("dgm"),
            name: parsed.name ?? "Imported schema",
            tables: parsed.tables,
            relationships: parsed.relationships ?? [],
            createdAt: parsed.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          }),
          "Imported document",
        )
        return
      }

      const base = {
        id: newId("dgm"),
        name: tab === "sql" ? "Imported from SQL" : "Imported from Mermaid",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      if (tab === "sql") {
        const { tables, relationships, warnings } = parseSql(text)
        if (!tables.length) throw new Error("No CREATE TABLE statements found")
        commit(autoLayout({ ...base, tables, relationships }), `Imported ${tables.length} tables`)
        if (warnings.length) toast.warning(`${warnings.length} statement(s) skipped`, { description: warnings[0] })
        return
      }

      const { tables, relationships, errors } = parseMermaid(text)
      if (!tables.length) throw new Error("No entities found in that Mermaid source")
      commit(autoLayout({ ...base, tables, relationships }), `Imported ${tables.length} tables`)
      if (errors.length) toast.warning(`${errors.length} line(s) could not be parsed`, { description: errors[0].message })
    } catch (error) {
      toast.error("Import failed", { description: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import schema</DialogTitle>
          <DialogDescription>This replaces the diagram currently on the canvas.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
            <TabsTrigger value="sql">SQL DDL</TabsTrigger>
            <TabsTrigger value="json">Cardinal JSON</TabsTrigger>
          </TabsList>
          {["mermaid", "sql", "json"].map((key) => (
            <TabsContent key={key} value={key}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                placeholder={PLACEHOLDERS[key]}
                className="h-72 resize-none font-mono text-[11px]"
              />
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!text.trim()}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
