import { create } from "zustand";
import { autoLayout, placeNewTables, type LayoutDirection } from "@/lib/layout";
import { parseMermaid, reconcile, type ParseResult } from "@/lib/mermaid/parse";
import { emptyDiagram } from "@/lib/sample";
import { patched } from "@/lib/patched";
import { removeItems, type ItemIds } from "@/lib/removeItems";
import type { Diagram } from "@/lib/types";
import { createRelationshipSlice, type RelationshipSlice } from "./relationshipSlice";
import { selectionIn } from "./selectionIn";
import { createSelectionSlice, type SelectionSlice } from "./selectionSlice";
import { createShapeSlice, type ShapeSlice } from "./shapeSlice";
import { createTableSlice, type TableSlice } from "./tableSlice";

export type { Selection } from "./selectionSlice";
export { newColumn } from "./tableSlice";

const HISTORY_LIMIT = 100;

export interface DiagramState extends SelectionSlice, TableSlice, RelationshipSlice, ShapeSlice {
  diagram: Diagram;
  past: Diagram[];
  future: Diagram[];
  parseErrors: ParseResult["errors"];
  dirty: boolean;

  apply: (fn: (draft: Diagram) => Diagram, options?: { commit?: boolean }) => void;
  /** Push an explicit snapshot onto the undo stack. */
  commitSnapshot: (snapshot: Diagram) => void;
  /** The document as it was when the current drag or resize began. */
  gestureOrigin: Diagram | null;
  /** Remember the document before a gesture that streams `{ commit: false }` updates. */
  beginGesture: () => void;
  /** Close the gesture with a single undo entry for everything it changed. */
  endGesture: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;

  replaceDiagram: (diagram: Diagram, options?: { resetHistory?: boolean }) => void;
  renameDiagram: (name: string) => void;

  /** Delete items as one undo step, as Backspace on the canvas does. */
  removeItems: (ids: ItemIds) => void;
  layout: (direction?: LayoutDirection) => void;
  applyMermaid: (source: string) => void;
}

const touch = (diagram: Diagram): Diagram => ({ ...diagram, updatedAt: Date.now() });

/** How a new diagram reaches the store: a selection whose item has gone clears with it. */
const showDiagram = (state: DiagramState, diagram: Diagram) => ({
  diagram,
  selection: selectionIn(diagram, state.selection),
});

export const useDiagram = create<DiagramState>((set, get, store) => ({
  ...createSelectionSlice(set, get, store),
  ...createTableSlice(set, get, store),
  ...createRelationshipSlice(set, get, store),
  ...createShapeSlice(set, get, store),

  diagram: emptyDiagram(),
  past: [],
  future: [],
  parseErrors: [],
  dirty: false,

  apply: (fn, options) => {
    const { diagram, past } = get();
    const next = fn(diagram);
    if (next === diagram) return;
    const commit = options?.commit ?? true;
    set({
      ...showDiagram(get(), touch(next)),
      past: commit ? [...past, diagram].slice(-HISTORY_LIMIT) : past,
      future: commit ? [] : get().future,
      dirty: true,
    });
  },

  commitSnapshot: (snapshot) => {
    const { past, diagram } = get();
    if (snapshot === diagram) return;
    set({ past: [...past, snapshot].slice(-HISTORY_LIMIT), future: [] });
  },

  gestureOrigin: null,

  beginGesture: () => set({ gestureOrigin: get().diagram }),

  endGesture: () => {
    const { gestureOrigin, commitSnapshot } = get();
    if (gestureOrigin) commitSnapshot(gestureOrigin);
    set({ gestureOrigin: null });
  },

  undo: () => {
    const { past, diagram, future } = get();
    const previous = past[past.length - 1];
    if (!previous) return;
    set({
      ...showDiagram(get(), previous),
      past: past.slice(0, -1),
      future: [diagram, ...future],
      dirty: true,
    });
  },

  redo: () => {
    const { past, diagram, future } = get();
    const [next, ...rest] = future;
    if (!next) return;
    set({ ...showDiagram(get(), next), past: [...past, diagram], future: rest, dirty: true });
  },

  markSaved: () => set({ dirty: false }),

  replaceDiagram: (diagram, options) =>
    set({
      diagram,
      past: options?.resetHistory === false ? get().past : [],
      future: [],
      selection: { kind: "none" },
      parseErrors: [],
      tool: "select",
      editingShapeId: null,
      gestureOrigin: null,
      dirty: true,
    }),

  renameDiagram: (name) => get().apply((d) => patched(d, { name })),

  removeItems: (ids) => {
    get().apply((d) => removeItems(d, ids));
    const { editingShapeId } = get();
    if (editingShapeId && ids.shapes?.includes(editingShapeId)) set({ editingShapeId: null });
  },

  layout: (direction = "LR") => get().apply((d) => autoLayout(d, direction)),

  applyMermaid: (source) => {
    const parsed = parseMermaid(source);
    set({ parseErrors: parsed.errors });
    if (parsed.tables.length === 0 && parsed.relationships.length === 0) return;
    get().apply((d) => {
      const merged = reconcile(d, parsed);
      return merged.tables.every((t) => t.position.x === 0 && t.position.y === 0)
        ? autoLayout(merged)
        : placeNewTables(merged);
    });
  },
}));
