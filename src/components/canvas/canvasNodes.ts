import type { Node, NodeChange } from "@xyflow/react";
import { tint } from "@/lib/color";
import { snapPoint } from "@/lib/shapes/rect";
import type { Point } from "@/lib/types";
import { isShapeNode } from "./shapeNodes";
import type { TableNodeData } from "./TableNode";

/** The two families of canvas node. Matches the node half of `Selection["kind"]`. */
export type NodeKind = "table" | "shape";

export const nodeKind = (node: Node): NodeKind => (isShapeNode(node) ? "shape" : "table");

const isTableNode = (node: Node): node is Node<TableNodeData, "table"> => node.type === "table";

export type NodeMove = { kind: NodeKind; id: string; position: Point };

/** The store move a React Flow change asks for, or null when it isn't one. */
export function nodeMove(change: NodeChange, kindOf: (id: string) => NodeKind): NodeMove | null {
  if (change.type !== "position" || !change.position) return null;
  const kind = kindOf(change.id);
  if (kind === "table") return { kind, id: change.id, position: change.position };
  // Resizing reports position too, without `dragging`; the resizer's own callback owns it.
  if (change.dragging === undefined) return null;
  return { kind, id: change.id, position: snapPoint(change.position) };
}

export const minimapColor = (node: Node) => {
  if (isShapeNode(node)) return tint(node.data.shape.color, 22);
  return isTableNode(node) ? node.data.table.accent : "transparent";
};

/** True for presses on empty canvas, including the inside of a shape, where a new table may go. */
export const isCanvasSurface = (target: EventTarget) =>
  target instanceof Element &&
  (target.classList.contains("react-flow__pane") ||
    target.closest("[data-shape-surface]") !== null);
