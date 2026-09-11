import { create } from "zustand"
import { newId } from "@/lib/id"
import { autoLayout, placeNewTables, type LayoutDirection } from "@/lib/layout"
import { parseMermaid, reconcile, type ParseResult } from "@/lib/mermaid/parse"
import { emptyDiagram } from "@/lib/sample"
import type { Column, Diagram, Relationship, Table } from "@/lib/types"
import { ACCENTS } from "@/lib/types"

export type Selection =
  | { kind: "table"; id: string }
  | { kind: "relationship"; id: string }
  | { kind: "none" }

const HISTORY_LIMIT = 100

interface DiagramState {
  diagram: Diagram
  past: Diagram[]
  future: Diagram[]
  selection: Selection
  parseErrors: ParseResult["errors"]
  dirty: boolean

  apply: (fn: (draft: Diagram) => Diagram, options?: { commit?: boolean }) => void
  /** Push an explicit snapshot onto the undo stack (used for drag gestures). */
  commitSnapshot: (snapshot: Diagram) => void
  undo: () => void
  redo: () => void
  markSaved: () => void

  select: (selection: Selection) => void
  replaceDiagram: (diagram: Diagram, options?: { resetHistory?: boolean }) => void
  renameDiagram: (name: string) => void

  addTable: (position?: { x: number; y: number }) => string
  updateTable: (id: string, patch: Partial<Omit<Table, "id" | "columns">>) => void
  removeTable: (id: string) => void
  duplicateTable: (id: string) => void
  moveTable: (id: string, position: { x: number; y: number }, commit?: boolean) => void

  addColumn: (tableId: string, partial?: Partial<Column>) => void
  updateColumn: (tableId: string, columnId: string, patch: Partial<Column>) => void
  removeColumn: (tableId: string, columnId: string) => void
  reorderColumn: (tableId: string, columnId: string, delta: number) => void

  addRelationship: (rel: Omit<Relationship, "id">) => void
  updateRelationship: (id: string, patch: Partial<Relationship>) => void
  setWaypoints: (id: string, waypoints: Relationship["waypoints"], commit?: boolean) => void
  removeRelationship: (id: string) => void

  layout: (direction?: LayoutDirection) => void
  applyMermaid: (source: string) => void
}

const touch = (diagram: Diagram): Diagram => ({ ...diagram, updatedAt: Date.now() })

const mapTable = (diagram: Diagram, id: string, fn: (table: Table) => Table): Diagram => ({
  ...diagram,
  tables: diagram.tables.map((table) => (table.id === id ? fn(table) : table)),
})

export const newColumn = (partial: Partial<Column> = {}): Column => ({
  id: newId("col"),
  name: partial.name ?? "new_column",
  type: partial.type ?? "string",
  pk: partial.pk ?? false,
  fk: partial.fk ?? false,
  uk: partial.uk ?? false,
  nullable: partial.nullable ?? true,
  defaultValue: partial.defaultValue,
  comment: partial.comment,
})

export const useDiagram = create<DiagramState>((set, get) => ({
  diagram: emptyDiagram(),
  past: [],
  future: [],
  selection: { kind: "none" },
  parseErrors: [],
  dirty: false,

  apply: (fn, options) => {
    const { diagram, past } = get()
    const next = touch(fn(diagram))
    if (next === diagram) return
    const commit = options?.commit ?? true
    set({
      diagram: next,
      past: commit ? [...past, diagram].slice(-HISTORY_LIMIT) : past,
      future: commit ? [] : get().future,
      dirty: true,
    })
  },

  commitSnapshot: (snapshot) => {
    const { past, diagram } = get()
    if (snapshot === diagram) return
    set({ past: [...past, snapshot].slice(-HISTORY_LIMIT), future: [] })
  },

  undo: () => {
    const { past, diagram, future } = get()
    const previous = past[past.length - 1]
    if (!previous) return
    set({ diagram: previous, past: past.slice(0, -1), future: [diagram, ...future], dirty: true })
  },

  redo: () => {
    const { past, diagram, future } = get()
    const [next, ...rest] = future
    if (!next) return
    set({ diagram: next, past: [...past, diagram], future: rest, dirty: true })
  },

  markSaved: () => set({ dirty: false }),

  select: (selection) => set({ selection }),

  replaceDiagram: (diagram, options) =>
    set({
      diagram,
      past: options?.resetHistory === false ? get().past : [],
      future: [],
      selection: { kind: "none" },
      parseErrors: [],
      dirty: true,
    }),

  renameDiagram: (name) => get().apply((d) => ({ ...d, name })),

  addTable: (position) => {
    const id = newId("tbl")
    const index = get().diagram.tables.length
    get().apply((d) => ({
      ...d,
      tables: [
        ...d.tables,
        {
          id,
          name: `table_${index + 1}`,
          accent: ACCENTS[index % ACCENTS.length],
          position: position ?? { x: 80 + index * 40, y: 80 + index * 40 },
          columns: [newColumn({ name: "id", type: "uuid", pk: true, nullable: false })],
        },
      ],
    }))
    set({ selection: { kind: "table", id } })
    return id
  },

  updateTable: (id, patch) => get().apply((d) => mapTable(d, id, (t) => ({ ...t, ...patch }))),

  removeTable: (id) =>
    get().apply((d) => ({
      ...d,
      tables: d.tables.filter((t) => t.id !== id),
      relationships: d.relationships.filter((r) => r.sourceTableId !== id && r.targetTableId !== id),
    })),

  duplicateTable: (id) => {
    const source = get().diagram.tables.find((t) => t.id === id)
    if (!source) return
    const copy: Table = {
      ...source,
      id: newId("tbl"),
      name: `${source.name}_copy`,
      position: { x: source.position.x + 48, y: source.position.y + 48 },
      columns: source.columns.map((c) => ({ ...c, id: newId("col") })),
    }
    get().apply((d) => ({ ...d, tables: [...d.tables, copy] }))
    set({ selection: { kind: "table", id: copy.id } })
  },

  moveTable: (id, position, commit = true) =>
    get().apply((d) => mapTable(d, id, (t) => ({ ...t, position })), { commit }),

  addColumn: (tableId, partial) =>
    get().apply((d) => mapTable(d, tableId, (t) => ({ ...t, columns: [...t.columns, newColumn(partial)] }))),

  updateColumn: (tableId, columnId, patch) =>
    get().apply((d) =>
      mapTable(d, tableId, (t) => ({
        ...t,
        columns: t.columns.map((c) =>
          c.id === columnId ? { ...c, ...patch, nullable: (patch.pk ?? c.pk) ? false : (patch.nullable ?? c.nullable) } : c,
        ),
      })),
    ),

  removeColumn: (tableId, columnId) =>
    get().apply((d) => ({
      ...mapTable(d, tableId, (t) => ({ ...t, columns: t.columns.filter((c) => c.id !== columnId) })),
      relationships: d.relationships.map((r) => ({
        ...r,
        sourceColumnId: r.sourceColumnId === columnId ? undefined : r.sourceColumnId,
        targetColumnId: r.targetColumnId === columnId ? undefined : r.targetColumnId,
      })),
    })),

  reorderColumn: (tableId, columnId, delta) =>
    get().apply((d) =>
      mapTable(d, tableId, (t) => {
        const index = t.columns.findIndex((c) => c.id === columnId)
        const next = index + delta
        if (index === -1 || next < 0 || next >= t.columns.length) return t
        const columns = [...t.columns]
        const [moved] = columns.splice(index, 1)
        columns.splice(next, 0, moved)
        return { ...t, columns }
      }),
    ),

  addRelationship: (rel) => {
    const id = newId("rel")
    get().apply((d) => ({ ...d, relationships: [...d.relationships, { ...rel, id }] }))
    set({ selection: { kind: "relationship", id } })
  },

  updateRelationship: (id, patch) =>
    get().apply((d) => ({
      ...d,
      relationships: d.relationships.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  setWaypoints: (id, waypoints, commit = true) =>
    get().apply(
      (d) => ({
        ...d,
        relationships: d.relationships.map((r) =>
          r.id === id ? { ...r, waypoints: waypoints?.length ? waypoints : undefined } : r,
        ),
      }),
      { commit },
    ),

  removeRelationship: (id) =>
    get().apply((d) => ({ ...d, relationships: d.relationships.filter((r) => r.id !== id) })),

  layout: (direction = "LR") => get().apply((d) => autoLayout(d, direction)),

  applyMermaid: (source) => {
    const parsed = parseMermaid(source)
    set({ parseErrors: parsed.errors })
    if (parsed.tables.length === 0 && parsed.relationships.length === 0) return
    get().apply((d) => {
      const merged = reconcile(d, parsed)
      return merged.tables.every((t) => t.position.x === 0 && t.position.y === 0)
        ? autoLayout(merged)
        : placeNewTables(merged)
    })
  },
}))
