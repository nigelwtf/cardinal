import { MousePointer2, Square, type LucideIcon } from "lucide-react";
import { isShapeKind } from "@/lib/shapes/definitions";
import type { ShapeKind } from "@/lib/types";
import type { Tool } from "@/store/shapeSlice";

export interface ToolDefinition {
  id: Tool;
  label: string;
  /** Single-key shortcut, also shown in the rail's tooltip. */
  key: string;
  icon: LucideIcon;
}

// Keyed by kind so a new shape fails the build until it has a tool to draw it with. Labels are
// what users see; the kind names are internal.
const shapeTools: { [K in ShapeKind]: Omit<ToolDefinition, "id"> } = {
  box: { label: "Section", key: "s", icon: Square },
};

export const shapeLabel = (kind: ShapeKind) => shapeTools[kind].label;

export const TOOLS: readonly ToolDefinition[] = [
  { id: "select", label: "Select", key: "v", icon: MousePointer2 },
  ...Object.entries(shapeTools).flatMap(([id, tool]) => (isShapeKind(id) ? [{ ...tool, id }] : [])),
];
