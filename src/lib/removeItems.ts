import type { Diagram } from "@/lib/types";

/** The items to delete together, by kind. */
export type ItemIds = {
  tables?: readonly string[];
  relationships?: readonly string[];
  shapes?: readonly string[];
};

/**
 * `diagram` without those items, or any relationship still joined to a removed table. `diagram`
 * itself when none of them is in it.
 */
export function removeItems(diagram: Diagram, ids: ItemIds): Diagram {
  const tables = new Set(ids.tables);
  const relationships = new Set(ids.relationships);
  const shapes = new Set(ids.shapes);
  const next = {
    ...diagram,
    tables: diagram.tables.filter((t) => !tables.has(t.id)),
    relationships: diagram.relationships.filter(
      (r) =>
        !relationships.has(r.id) && !tables.has(r.sourceTableId) && !tables.has(r.targetTableId),
    ),
    shapes: diagram.shapes.filter((s) => !shapes.has(s.id)),
  };
  const unchanged =
    next.tables.length === diagram.tables.length &&
    next.relationships.length === diagram.relationships.length &&
    next.shapes.length === diagram.shapes.length;
  return unchanged ? diagram : next;
}
