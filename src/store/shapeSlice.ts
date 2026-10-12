import type { StateCreator } from "zustand";
import { mapById } from "@/lib/mapById";
import { patched } from "@/lib/patched";
import { moveWithContents } from "@/lib/shapes/moveWithContents";
import type { Rect } from "@/lib/shapes/rect";
import type { BoxShape, Diagram, Point, Shape, ShapeKind } from "@/lib/types";
import type { DiagramState } from "./useDiagram";

/** What a canvas press does: select and drag as usual, or draw a new shape of that kind. */
export type Tool = "select" | ShapeKind;

export interface ShapeSlice {
  tool: Tool;
  /** The shape whose title is open for inline editing, if any. */
  editingShapeId: string | null;

  setTool: (tool: Tool) => void;
  setEditingShape: (id: string | null) => void;

  /** Adds a drawn shape, selects it and opens its title, then hands the canvas back to select. */
  addShape: (shape: Shape) => void;
  /** Moves a shape and whatever sits fully inside it, measured from the gesture's start. */
  moveShape: (id: string, position: Point, commit?: boolean) => void;
  resizeShape: (id: string, rect: Rect, commit?: boolean) => void;
  updateBox: (id: string, patch: Partial<Pick<BoxShape, "title" | "color">>) => void;
  removeShape: (id: string) => void;
}

const mapShape = (diagram: Diagram, id: string, fn: (shape: Shape) => Shape): Diagram =>
  patched(diagram, { shapes: mapById(diagram.shapes, id, fn) });

export const createShapeSlice: StateCreator<DiagramState, [], [], ShapeSlice> = (set, get) => ({
  tool: "select",
  editingShapeId: null,

  setTool: (tool) => set({ tool }),
  setEditingShape: (editingShapeId) => set({ editingShapeId }),

  addShape: (shape) => {
    get().apply((d) => ({ ...d, shapes: [...d.shapes, shape] }));
    set({ selection: { kind: "shape", id: shape.id }, editingShapeId: shape.id, tool: "select" });
  },

  moveShape: (id, position, commit = true) =>
    get().apply((d) => moveWithContents(d, get().gestureOrigin ?? d, id, position), { commit }),

  resizeShape: (id, { x, y, width, height }, commit = true) =>
    get().apply(
      (d) => mapShape(d, id, (s) => ({ ...s, position: { x, y }, size: { width, height } })),
      { commit },
    ),

  updateBox: (id, patch) =>
    get().apply((d) => mapShape(d, id, (s) => (s.kind === "box" ? patched(s, patch) : s))),

  removeShape: (id) => get().removeItems({ shapes: [id] }),
});
