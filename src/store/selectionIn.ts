import type { Diagram } from "@/lib/types";
import type { Selection } from "./selectionSlice";

const NOTHING: Selection = { kind: "none" };

/**
 * `selection` if its item is still in `diagram`, else nothing selected. A delete or an undo can
 * take the item away, and the Inspector would go on showing an empty panel for it.
 */
export function selectionIn(diagram: Diagram, selection: Selection): Selection {
  switch (selection.kind) {
    case "none":
      return selection;
    case "table":
      return diagram.tables.some((t) => t.id === selection.id) ? selection : NOTHING;
    case "relationship":
      return diagram.relationships.some((r) => r.id === selection.id) ? selection : NOTHING;
    case "shape":
      return diagram.shapes.some((s) => s.id === selection.id) ? selection : NOTHING;
    default: {
      const _exhaustive: never = selection;
      return _exhaustive;
    }
  }
}
