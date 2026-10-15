import type { StateCreator } from "zustand";
import { newId } from "@/lib/id";
import { uniqueTableName } from "@/lib/tableName";
import { mapById } from "@/lib/mapById";
import { patched } from "@/lib/patched";
import { ACCENTS, type Column, type Diagram, type Table } from "@/lib/types";
import type { DiagramState } from "./useDiagram";

export interface TableSlice {
  addTable: (position?: { x: number; y: number }) => string;
  updateTable: (id: string, patch: Partial<Omit<Table, "id" | "columns">>) => void;
  removeTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  moveTable: (id: string, position: { x: number; y: number }, commit?: boolean) => void;

  addColumn: (tableId: string, partial?: Partial<Column>) => void;
  updateColumn: (tableId: string, columnId: string, patch: Partial<Column>) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  reorderColumn: (tableId: string, columnId: string, delta: number) => void;
}

/** `diagram` with one table passed through `fn`, or `diagram` itself when nothing changed. */
export const mapTable = (diagram: Diagram, id: string, fn: (table: Table) => Table): Diagram =>
  patched(diagram, { tables: mapById(diagram.tables, id, fn) });

/** `table` with one column patched. A primary key is never nullable. */
export const patchColumn = (table: Table, columnId: string, patch: Partial<Column>): Table =>
  patched(table, {
    columns: mapById(table.columns, columnId, (c) =>
      patched(c, {
        ...patch,
        nullable: (patch.pk ?? c.pk) ? false : (patch.nullable ?? c.nullable),
      }),
    ),
  });

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
});

export const createTableSlice: StateCreator<DiagramState, [], [], TableSlice> = (set, get) => ({
  addTable: (position) => {
    const id = newId("tbl");
    const index = get().diagram.tables.length;
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
    }));
    set({ selection: { kind: "table", id } });
    return id;
  },

  updateTable: (id, patch) => get().apply((d) => mapTable(d, id, (t) => patched(t, patch))),

  removeTable: (id) => get().removeItems({ tables: [id] }),

  duplicateTable: (id) => {
    const source = get().diagram.tables.find((t) => t.id === id);
    if (!source) return;
    const copy: Table = {
      ...source,
      id: newId("tbl"),
      name: uniqueTableName(source.name, new Set(get().diagram.tables.map((t) => t.name))),
      position: { x: source.position.x + 48, y: source.position.y + 48 },
      columns: source.columns.map((c) => ({ ...c, id: newId("col") })),
    };
    get().apply((d) => ({ ...d, tables: [...d.tables, copy] }));
    set({ selection: { kind: "table", id: copy.id } });
  },

  moveTable: (id, position, commit = true) =>
    get().apply(
      (d) => mapTable(d, id, (t) => patched(t, { position: patched(t.position, position) })),
      { commit },
    ),

  addColumn: (tableId, partial) =>
    get().apply((d) =>
      mapTable(d, tableId, (t) => ({ ...t, columns: [...t.columns, newColumn(partial)] })),
    ),

  updateColumn: (tableId, columnId, patch) =>
    get().apply((d) => mapTable(d, tableId, (t) => patchColumn(t, columnId, patch))),

  removeColumn: (tableId, columnId) =>
    get().apply((d) => ({
      ...mapTable(d, tableId, (t) => ({
        ...t,
        columns: t.columns.filter((c) => c.id !== columnId),
      })),
      relationships: d.relationships.map((r) => ({
        ...r,
        sourceColumnId: r.sourceColumnId === columnId ? undefined : r.sourceColumnId,
        targetColumnId: r.targetColumnId === columnId ? undefined : r.targetColumnId,
      })),
    })),

  reorderColumn: (tableId, columnId, delta) =>
    get().apply((d) =>
      mapTable(d, tableId, (t) => {
        const index = t.columns.findIndex((c) => c.id === columnId);
        const next = index + delta;
        if (index === -1 || next < 0 || next >= t.columns.length) return t;
        const columns = [...t.columns];
        const [moved] = columns.splice(index, 1);
        columns.splice(next, 0, moved);
        return { ...t, columns };
      }),
    ),
});
