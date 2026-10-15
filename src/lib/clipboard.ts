import { newId } from "@/lib/id";
import { uniqueTableName } from "@/lib/tableName";
import type { Diagram, Relationship, Table } from "@/lib/types";

/**
 * Held in memory only. This copy is just for Cardinal the app so it doesn't cross a tab.
 */
export interface Clip {
  tables: Table[];
  relationships: Relationship[];
}

/** What a copy takes from `diagram`: the tables `ids` names, in diagram order. */
export function collectClip(diagram: Diagram, ids: readonly string[]): Clip {
  const copied = new Set(ids);
  return {
    tables: diagram.tables.filter((table) => copied.has(table.id)),
    relationships: diagram.relationships.filter(
      (rel) => copied.has(rel.sourceTableId) && copied.has(rel.targetTableId),
    ),
  };
}

/** The new id for `id`, or a loud failure if the clip does not carry it. */
const renamed = (ids: ReadonlyMap<string, string>, id: string) => {
  const next = ids.get(id);
  if (!next) throw new Error(`Clip references ${id}, which it does not contain`);
  return next;
};

/**
 * `clip` ready to join a diagram: every id replaced, and every table renamed
 * past the names in `taken` so it cannot shadow what it was copied from. Table
 * names are the identity in Mermaid and SQL, so a duplicate would emit a
 * duplicate entity and mis-reconcile against the original.
 */
export function instantiateClip(clip: Clip, taken: ReadonlySet<string>): Clip {
  const names = new Set(taken);
  const tableIds = new Map<string, string>();
  const columnIds = new Map<string, string>();

  const tables = clip.tables.map((table) => {
    const id = newId("tbl");
    tableIds.set(table.id, id);
    const name = uniqueTableName(table.name, names);
    names.add(name);
    return {
      ...table,
      id,
      name,
      columns: table.columns.map((column) => {
        const columnId = newId("col");
        columnIds.set(column.id, columnId);
        return { ...column, id: columnId };
      }),
    };
  });

  return {
    tables,
    relationships: clip.relationships.map((rel) => ({
      ...rel,
      id: newId("rel"),
      sourceTableId: renamed(tableIds, rel.sourceTableId),
      targetTableId: renamed(tableIds, rel.targetTableId),
      sourceColumnId: rel.sourceColumnId ? renamed(columnIds, rel.sourceColumnId) : undefined,
      targetColumnId: rel.targetColumnId ? renamed(columnIds, rel.targetColumnId) : undefined,
    })),
  };
}

/** `tables` moved down and right, so a paste does not land exactly on its source. */
export function offsetTables(tables: readonly Table[], offset: number): Table[] {
  return tables.map((table) => ({
    ...table,
    position: { x: table.position.x + offset, y: table.position.y + offset },
  }));
}
