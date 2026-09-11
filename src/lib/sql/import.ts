import { newId } from "@/lib/id"
import type { Column, Relationship, Table } from "@/lib/types"
import { ACCENTS } from "@/lib/types"

/** Split on commas that sit at bracket depth zero. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  let quoteChar: string | null = null

  for (const char of body) {
    if (quoteChar) {
      current += char
      if (char === quoteChar) quoteChar = null
      continue
    }
    if (char === "'" || char === '"' || char === "`") {
      quoteChar = char
      current += char
      continue
    }
    if (char === "(") depth++
    if (char === ")") depth--
    if (char === "," && depth === 0) {
      parts.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

/** Index just past the ")" that closes one paren already consumed at `start`, skipping quoted spans. */
function findMatchingClose(text: string, start: number): number {
  let depth = 1
  let quoteChar: string | null = null
  let i = start
  while (i < text.length && depth > 0) {
    const char = text[i]
    if (quoteChar) {
      if (char === quoteChar) quoteChar = null
    } else if (char === "'" || char === '"' || char === "`") {
      quoteChar = char
    } else if (char === "(") {
      depth++
    } else if (char === ")") {
      depth--
    }
    i++
  }
  return i
}

const clean = (raw: string) => raw.trim().replace(/^[`"[]|[`"\]]$/g, "").replace(/^\w+\./, "")

// Matches a possibly quoted/bracketed, optionally schema-qualified identifier (e.g. `"schema"."table"`).
const IDENT_SRC = "[`\"[\\w.\\]]+"

const TABLE_CONSTRAINT = /^(constraint\b|primary\s+key\b|foreign\s+key\b|unique\b|check\b|key\b|index\b)/i
const PK_CONSTRAINT_RE = /primary\s+key\s*\(([^)]*)\)/i
const UK_CONSTRAINT_RE = /^unique[^(]*\(([^)]*)\)/i
const FK_RE = new RegExp("foreign\\s+key\\s*\\(([^)]*)\\)\\s*references\\s+(" + IDENT_SRC + ")", "i")
const COLUMN_RE = /^([`"[\w\]]+)\s+([\w]+(?:\s*\([^)]*\))?(?:\s+\w+)?)/
const INLINE_REF_RE = new RegExp("references\\s+(" + IDENT_SRC + ")", "i")
const DEFAULT_RE = /default\s+((?:'[^']*')|(?:[^\s,]+(?:\([^)]*\))?))/i
const IS_PK_RE = /primary\s+key/i
const UNIQUE_TEST_RE = /\bunique\b/i
const NOT_NULL_RE = /not\s+null/i

const CREATE_TABLE_RE = new RegExp(
  "create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(" + IDENT_SRC + ")\\s*\\(",
  "gi",
)
const ALTER_FK_RE = new RegExp(
  "alter\\s+table\\s+(?:only\\s+)?(" + IDENT_SRC + ")[\\s\\S]*?" + FK_RE.source,
  "gi",
)

export interface SqlImportResult {
  tables: Table[]
  relationships: Relationship[]
  warnings: string[]
}

/** Apply `patch` to every column named in a comma-separated constraint column list. */
function applyToColumns(colByName: Map<string, Column>, namesCsv: string, patch: Partial<Column>) {
  for (const rawName of namesCsv.split(",")) {
    const column = colByName.get(clean(rawName).toLowerCase())
    if (column) Object.assign(column, patch)
  }
}

export function parseSql(sql: string): SqlImportResult {
  const source = sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, "")
  const tables: Table[] = []
  const warnings: string[] = []
  const byName = new Map<string, Table>()
  const columnsByTable = new Map<Table, Map<string, Column>>()
  const pending: { childTable: string; childColumn: string; parentTable: string }[] = []

  let match: RegExpExecArray | null
  while ((match = CREATE_TABLE_RE.exec(source))) {
    const name = clean(match[1])
    // Walk forward to the matching close paren.
    const bodyEnd = findMatchingClose(source, CREATE_TABLE_RE.lastIndex)
    const body = source.slice(CREATE_TABLE_RE.lastIndex, bodyEnd - 1)
    CREATE_TABLE_RE.lastIndex = bodyEnd

    const table: Table = {
      id: newId("tbl"),
      name,
      accent: ACCENTS[tables.length % ACCENTS.length],
      position: { x: 0, y: 0 },
      columns: [],
    }
    const colByName = new Map<string, Column>()

    for (const part of splitTopLevel(body)) {
      if (TABLE_CONSTRAINT.test(part)) {
        const pk = PK_CONSTRAINT_RE.exec(part)
        if (pk) applyToColumns(colByName, pk[1], { pk: true, nullable: false })

        const uk = UK_CONSTRAINT_RE.exec(part)
        if (uk) applyToColumns(colByName, uk[1], { uk: true })

        const fk = FK_RE.exec(part)
        if (fk) pending.push({ childTable: name, childColumn: clean(fk[1].split(",")[0]), parentTable: clean(fk[2]) })
        continue
      }

      const columnMatch = COLUMN_RE.exec(part)
      if (!columnMatch) {
        warnings.push(`Skipped definition in ${name}: ${part.slice(0, 60)}`)
        continue
      }
      const columnName = clean(columnMatch[1])
      const inlineRef = INLINE_REF_RE.exec(part)
      if (inlineRef) pending.push({ childTable: name, childColumn: columnName, parentTable: clean(inlineRef[1]) })

      const defaultMatch = DEFAULT_RE.exec(part)
      const isPk = IS_PK_RE.test(part)
      const column: Column = {
        id: newId("col"),
        name: columnName,
        type: columnMatch[2].trim().replace(/\s+/g, " "),
        pk: isPk,
        fk: Boolean(inlineRef),
        uk: UNIQUE_TEST_RE.test(part),
        nullable: isPk ? false : !NOT_NULL_RE.test(part),
        defaultValue: defaultMatch?.[1],
      }
      table.columns.push(column)
      colByName.set(columnName.toLowerCase(), column)
    }

    tables.push(table)
    byName.set(name.toLowerCase(), table)
    columnsByTable.set(table, colByName)
  }

  while ((match = ALTER_FK_RE.exec(source))) {
    pending.push({
      childTable: clean(match[1]),
      childColumn: clean(match[2].split(",")[0]),
      parentTable: clean(match[3]),
    })
  }

  const pkColumnCache = new Map<Table, Column | undefined>()
  const pkColumnOf = (table: Table) => {
    if (!pkColumnCache.has(table)) pkColumnCache.set(table, table.columns.find((c) => c.pk))
    return pkColumnCache.get(table)
  }

  const relationships: Relationship[] = []
  const seen = new Set<string>()
  for (const link of pending) {
    const child = byName.get(link.childTable.toLowerCase())
    const parent = byName.get(link.parentTable.toLowerCase())
    if (!child || !parent) {
      warnings.push(`Unresolved foreign key ${link.childTable}.${link.childColumn} -> ${link.parentTable}`)
      continue
    }
    const childColumn = columnsByTable.get(child)?.get(link.childColumn.toLowerCase())
    if (childColumn) childColumn.fk = true
    const key = `${parent.id}->${child.id}:${link.childColumn}`
    if (seen.has(key)) continue
    seen.add(key)

    relationships.push({
      id: newId("rel"),
      sourceTableId: parent.id,
      targetTableId: child.id,
      targetColumnId: childColumn?.id,
      sourceColumnId: pkColumnOf(parent)?.id,
      sourceCardinality: "one",
      targetCardinality: childColumn?.nullable === false ? "one-or-more" : "zero-or-more",
      identifying: Boolean(childColumn?.pk),
      label: link.childColumn.replace(/_?id$/i, "") || "references",
    })
  }

  return { tables, relationships, warnings }
}
