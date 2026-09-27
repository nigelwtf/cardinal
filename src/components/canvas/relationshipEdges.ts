import type { Edge } from "@xyflow/react";
import { tableCenter } from "@/lib/layout";
import type { AnchorSide, Diagram, Table } from "@/lib/types";
import type { Selection } from "@/store/useDiagram";
import { TABLE_HANDLE, handleId } from "./handles";
import type { RelationshipEdgeData } from "./RelationshipEdge";

// A relationship pinned to a column that no longer exists falls back to the table header.
const anchor = (table: Table, columnId?: string) =>
  columnId && table.columns.some((c) => c.id === columnId) ? columnId : TABLE_HANDLE;

// A pinned top/bottom side only makes sense anchored to the whole table — a column's
// own row has no top/bottom edge of its own — so fall back to auto for that combination.
const resolveSide = (pinned: AnchorSide | undefined, auto: AnchorSide, wholeTable: boolean) =>
  pinned && (wholeTable || pinned === "left" || pinned === "right") ? pinned : auto;

/** React Flow edges for every relationship whose tables both exist. Unpinned ends leave from
 *  the sides that face each other. */
export function relationshipEdges(
  diagram: Diagram,
  selection: Selection,
): Edge<RelationshipEdgeData>[] {
  const byId = new Map(diagram.tables.map((t) => [t.id, t]));
  return diagram.relationships.flatMap((rel) => {
    const source = byId.get(rel.sourceTableId);
    const target = byId.get(rel.targetTableId);
    if (!source || !target) return [];

    const sourceRight = tableCenter(source).x <= tableCenter(target).x;
    const autoSourceSide: AnchorSide = sourceRight ? "right" : "left";
    const autoTargetSide: AnchorSide = sourceRight ? "left" : "right";

    const sourceAnchor = anchor(source, rel.sourceColumnId);
    const targetAnchor = anchor(target, rel.targetColumnId);
    const sourceSide = resolveSide(rel.sourceSide, autoSourceSide, sourceAnchor === TABLE_HANDLE);
    const targetSide = resolveSide(rel.targetSide, autoTargetSide, targetAnchor === TABLE_HANDLE);

    return [
      {
        id: rel.id,
        type: "relationship",
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: handleId(sourceAnchor, "source", sourceSide),
        targetHandle: handleId(targetAnchor, "target", targetSide),
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
