import type { Edge } from "@xyflow/react";
import { NODE_WIDTH } from "@/lib/layout";
import type { Diagram, Table } from "@/lib/types";
import type { Selection } from "@/store/useDiagram";
import type { RelationshipEdgeData } from "./RelationshipEdge";
import { TABLE_HANDLE, handleId } from "./tableHandles";

// A relationship pinned to a column that no longer exists falls back to the table header.
const anchor = (table: Table, columnId?: string) =>
  columnId && table.columns.some((c) => c.id === columnId) ? columnId : TABLE_HANDLE;

/** React Flow edges for every relationship whose tables both exist, leaving from facing sides. */
export function relationshipEdges(
  diagram: Diagram,
  selection: Selection,
): Edge<RelationshipEdgeData>[] {
  const byId = new Map(diagram.tables.map((t) => [t.id, t]));
  return diagram.relationships.flatMap((rel) => {
    const source = byId.get(rel.sourceTableId);
    const target = byId.get(rel.targetTableId);
    if (!source || !target) return [];

    const sourceRight = source.position.x + NODE_WIDTH / 2 <= target.position.x + NODE_WIDTH / 2;
    const sourceSide = sourceRight ? "right" : "left";
    const targetSide = sourceRight ? "left" : "right";

    return [
      {
        id: rel.id,
        type: "relationship",
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: handleId(anchor(source, rel.sourceColumnId), "source", sourceSide),
        targetHandle: handleId(anchor(target, rel.targetColumnId), "target", targetSide),
        selected: selection.kind === "relationship" && selection.id === rel.id,
        reconnectable: true,
        data: {
          label: rel.label,
          identifying: rel.identifying,
          sourceCardinality: rel.sourceCardinality,
          targetCardinality: rel.targetCardinality,
          waypoints: rel.waypoints,
          dimmed: false,
        },
      },
    ];
  });
}
