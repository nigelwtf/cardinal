import type { Diagram, Table } from "@/lib/types"
import { LEFT_TOKENS, RIGHT_TOKENS } from "./tokens"

const SAFE = /^[A-Za-z_][A-Za-z0-9_-]*$/

export const mermaidName = (raw: string) => {
  const name = raw.trim() || "UNNAMED"
  return SAFE.test(name) ? name : `"${name.replace(/"/g, "'")}"`
}

const mermaidType = (raw: string) => {
  const type = (raw || "unknown").trim().replace(/\s+/g, "_")
  return /^[A-Za-z_][A-Za-z0-9_()[\],-]*$/.test(type) ? type : "unknown"
}

const attributeLine = (column: Table["columns"][number]) => {
  const keys = [column.pk && "PK", column.fk && "FK", column.uk && "UK"].filter(Boolean)
  const notes: string[] = []
  if (column.comment) notes.push(column.comment)
  if (!column.nullable && !column.pk) notes.push("not null")
  if (column.defaultValue) notes.push(`default ${column.defaultValue}`)

  return [
    mermaidType(column.type),
    column.name.trim().replace(/\s+/g, "_") || "column",
    keys.join(","),
    notes.length ? `"${notes.join("; ").replace(/"/g, "'")}"` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export function toMermaid(diagram: Diagram): string {
  const lines: string[] = ["erDiagram"]
  const nameOf = new Map(diagram.tables.map((t) => [t.id, mermaidName(t.name)]))

  for (const rel of diagram.relationships) {
    const source = nameOf.get(rel.sourceTableId)
    const target = nameOf.get(rel.targetTableId)
    if (!source || !target) continue
    const link = `${LEFT_TOKENS[rel.sourceCardinality]}${rel.identifying ? "--" : ".."}${RIGHT_TOKENS[rel.targetCardinality]}`
    const label = (rel.label || "relates to").replace(/"/g, "'")
    lines.push(`    ${source} ${link} ${target} : "${label}"`)
  }

  if (diagram.relationships.length && diagram.tables.length) lines.push("")

  for (const table of diagram.tables) {
    lines.push(`    ${mermaidName(table.name)} {`)
    for (const column of table.columns) lines.push(`        ${attributeLine(column)}`)
    lines.push("    }")
  }

  return lines.join("\n")
}
