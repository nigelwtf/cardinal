import type { Diagram, Relationship } from "@/lib/types"

/** Relationships once carried a single `offset` bend before multi-waypoint routing. */
interface LegacyRelationship extends Relationship {
  offset?: { x: number; y: number }
}

/**
 * Bring a stored or imported document up to the current shape. Documents live in
 * IndexedDB indefinitely, so old ones have to keep opening.
 */
export function normalizeDiagram(diagram: Diagram): Diagram {
  return {
    ...diagram,
    relationships: diagram.relationships.map((relationship) => {
      const { offset, ...rest } = relationship as LegacyRelationship
      if (!offset || rest.waypoints?.length) return rest
      return { ...rest, waypoints: [offset] }
    }),
  }
}
