import { newId } from "@/lib/id"
import type { Column, Diagram, Relationship, Table } from "@/lib/types"
import { ACCENTS } from "@/lib/types"
import { LEFT_LOOKUP, RIGHT_LOOKUP } from "./tokens"

export interface ParseResult {
  tables: Table[]
  relationships: Relationship[]
  errors: { line: number; message: string }[]
}

const NAME = `(?:"[^"]*"|[A-Za-z_][A-Za-z0-9_.$-]*)`
const REL_RE = new RegExp(`^(${NAME})\\s+([|}o]{2})(--|\\.\\.)([|o{]{2})\\s+(${NAME})\\s*:\\s*(.*)$`)
const BLOCK_RE = new RegExp(`^(${NAME})\\s*\\{$`)
const ATTR_RE =
  /^([A-Za-z_][\w()[\],-]*)\s+([A-Za-z_][\w-]*)\s*((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*)?\s*(?:"([^"]*)")?\s*$/

const unquote = (raw: string) => (raw.startsWith('"') ? raw.slice(1, -1) : raw)

function parseNotes(note: string | undefined) {
  if (!note) return { comment: undefined, nullable: true, defaultValue: undefined }
  const parts = note.split(";").map((p) => p.trim()).filter(Boolean)
  let nullable = true
  let defaultValue: string | undefined
  const rest: string[] = []
  for (const part of parts) {
    if (/^not[\s_]?null$/i.test(part)) nullable = false
    else if (/^default\s+/i.test(part)) defaultValue = part.replace(/^default\s+/i, "")
    else rest.push(part)
  }
  return { comment: rest.join("; ") || undefined, nullable, defaultValue }
}

export function parseMermaid(source: string): ParseResult {
  const errors: ParseResult["errors"] = []
  const tables = new Map<string, Table>()
  const relationships: Relationship[] = []
  let accentIndex = 0

  const ensureTable = (rawName: string): Table => {
    const name = unquote(rawName)
    const existing = tables.get(name)
    if (existing) return existing
    const table: Table = {
      id: newId("tbl"),
      name,
      accent: ACCENTS[accentIndex++ % ACCENTS.length],
      position: { x: 0, y: 0 },
      columns: [],
    }
    tables.set(name, table)
    return table
  }

  let current: Table | null = null

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/%%.*$/, "").trim()
    if (!line) return
    if (/^erdiagram\b/i.test(line)) return
    if (/^(title|direction|classDef|class|style|accTitle|accDescr)\b/i.test(line)) return

    if (current) {
      if (line === "}") {
        current = null
        return
      }
      const attr = ATTR_RE.exec(line)
      if (!attr) {
        errors.push({ line: index + 1, message: `Could not read attribute: "${line}"` })
        return
      }
      const [, type, name, keyList, note] = attr
      const keys = (keyList ?? "").split(",").map((k) => k.trim().toUpperCase())
      const { comment, nullable, defaultValue } = parseNotes(note)
      const column: Column = {
        id: newId("col"),
        name,
        type,
        pk: keys.includes("PK"),
        fk: keys.includes("FK"),
        uk: keys.includes("UK"),
        nullable: keys.includes("PK") ? false : nullable,
        defaultValue,
        comment,
      }
      current.columns.push(column)
      return
    }

    const block = BLOCK_RE.exec(line)
    if (block) {
      current = ensureTable(block[1])
      return
    }

    const rel = REL_RE.exec(line)
    if (rel) {
      const [, left, leftToken, link, rightToken, right, rawLabel] = rel
      const sourceCardinality = LEFT_LOOKUP[leftToken]
      const targetCardinality = RIGHT_LOOKUP[rightToken]
      if (!sourceCardinality || !targetCardinality) {
        errors.push({ line: index + 1, message: `Unknown cardinality in "${line}"` })
        return
      }
      relationships.push({
        id: newId("rel"),
        sourceTableId: ensureTable(left).id,
        targetTableId: ensureTable(right).id,
        sourceCardinality,
        targetCardinality,
        identifying: link === "--",
        label: unquote(rawLabel.trim()) || "relates to",
      })
      return
    }

    errors.push({ line: index + 1, message: `Unrecognised statement: "${line}"` })
  })

  return { tables: [...tables.values()], relationships, errors }
}

/**
 * Merge freshly parsed mermaid back onto an existing diagram, preserving ids,
 * canvas positions and the fields mermaid cannot express.
 */
export function reconcile(previous: Diagram, parsed: ParseResult): Diagram {
  const prevTables = new Map(previous.tables.map((t) => [t.name.toLowerCase(), t]))

  const tables = parsed.tables.map((table) => {
    const prev = prevTables.get(table.name.toLowerCase())
    if (!prev) return table
    const prevColumns = new Map(prev.columns.map((c) => [c.name.toLowerCase(), c]))
    return {
      ...table,
      id: prev.id,
      accent: prev.accent,
      comment: prev.comment,
      position: prev.position,
      columns: table.columns.map((column) => {
        const prevColumn = prevColumns.get(column.name.toLowerCase())
        return prevColumn ? { ...column, id: prevColumn.id } : column
      }),
    }
  })

  const idRemap = new Map<string, string>()
  parsed.tables.forEach((table) => {
    const prev = prevTables.get(table.name.toLowerCase())
    if (prev) idRemap.set(table.id, prev.id)
  })

  const prevRels = new Map(
    previous.relationships.map((r) => [`${r.sourceTableId}->${r.targetTableId}:${r.label}`, r]),
  )

  const relationships = parsed.relationships.map((rel) => {
    const sourceTableId = idRemap.get(rel.sourceTableId) ?? rel.sourceTableId
    const targetTableId = idRemap.get(rel.targetTableId) ?? rel.targetTableId
    const prev = prevRels.get(`${sourceTableId}->${targetTableId}:${rel.label}`)
    return {
      ...rel,
      sourceTableId,
      targetTableId,
      id: prev?.id ?? rel.id,
      sourceColumnId: prev?.sourceColumnId,
      targetColumnId: prev?.targetColumnId,
      waypoints: prev?.waypoints,
    }
  })

  return { ...previous, tables, relationships, updatedAt: Date.now() }
}
