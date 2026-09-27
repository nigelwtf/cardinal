import type { ComponentType } from "react";
import type { NodeProps } from "@xyflow/react";
import type { ShapeKind } from "@/lib/types";
import type { ShapeNode } from "./shapeNodes";
import { BoxNode } from "./shapes/BoxNode";
import { TableNode } from "./TableNode";

/** One node component per shape kind. A new kind fails the build here until it has one. */
const shapeNodeTypes: { [K in ShapeKind]: ComponentType<NodeProps<ShapeNode<K>>> } = {
  box: BoxNode,
};

export const nodeTypes = { table: TableNode, ...shapeNodeTypes };
