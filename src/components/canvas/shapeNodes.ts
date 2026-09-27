import type { Node } from "@xyflow/react";
import { isShapeKind } from "@/lib/shapes/definitions";
import type { Shape, ShapeKind } from "@/lib/types";
import type { Selection } from "@/store/useDiagram";

export interface ShapeNodeData<S extends Shape = Shape> extends Record<string, unknown> {
  shape: S;
}

/** React Flow node for one shape kind, typed so each kind's component sees its own shape. */
export type ShapeNode<K extends ShapeKind = ShapeKind> = Node<
  ShapeNodeData<Extract<Shape, { kind: K }>>,
  K
>;

// React Flow lifts a selected node by 1000. Starting well below that keeps a selected shape
// behind every table and edge, selected or not.
const SHAPE_Z_INDEX = -2000;

export const isShapeNode = (node: Node): node is ShapeNode =>
  node.type !== undefined && isShapeKind(node.type);

export const shapeNodes = (shapes: Shape[], selection: Selection): ShapeNode[] =>
  shapes.map((shape) => ({
    id: shape.id,
    type: shape.kind,
    position: shape.position,
    width: shape.size.width,
    height: shape.size.height,
    zIndex: SHAPE_Z_INDEX,
    selected: selection.kind === "shape" && selection.id === shape.id,
    data: { shape },
  }));
