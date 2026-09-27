import { isShapeKind } from "@/lib/shapes/definitions";
import type { Diagram, Relationship, Shape } from "@/lib/types";

/** Relationships once carried a single `offset` bend before multi-waypoint routing. */
interface LegacyRelationship extends Relationship {
  offset?: { x: number; y: number };
}

/** A document as it may sit in IndexedDB or a JSON file: ones saved before shapes have none. */
export type StoredDiagram = Omit<Diagram, "shapes"> & { shapes?: Shape[] };

/**
 * Bring a stored or imported document up to the current shape. Documents live in
 * IndexedDB indefinitely, so old ones have to keep opening.
 */
export function normalizeDiagram(diagram: StoredDiagram): Diagram {
  return {
    ...diagram,
    // A kind this build doesn't know (a file from a newer build) has nothing to render it.
    shapes: (diagram.shapes ?? []).filter((shape) => isShapeKind(shape.kind)),
    relationships: diagram.relationships.map((relationship) => {
      const { offset, ...rest } = relationship as LegacyRelationship;
      if (!offset || rest.waypoints?.length) return rest;
      return { ...rest, waypoints: [offset] };
    }),
  };
}
