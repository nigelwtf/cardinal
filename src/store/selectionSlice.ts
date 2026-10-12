import type { StateCreator } from "zustand";
import { isEnumType } from "@/lib/enum";
import type { DiagramState } from "./useDiagram";

export type Selection =
  | { kind: "table"; id: string }
  | { kind: "relationship"; id: string }
  | { kind: "shape"; id: string }
  | { kind: "none" };

export interface SelectionSlice {
  selection: Selection;
  /** Canvas-only UI state: which enum columns are showing every symbol instead of the clipped summary. */
  expandedEnumColumns: Set<string>;

  select: (selection: Selection) => void;
  toggleEnumExpanded: (columnId: string) => void;
  setAllEnumsExpanded: (expanded: boolean) => void;
}

export const createSelectionSlice: StateCreator<DiagramState, [], [], SelectionSlice> = (
  set,
  get,
) => ({
  selection: { kind: "none" },
  expandedEnumColumns: new Set(),

  select: (selection) => set({ selection }),

  toggleEnumExpanded: (columnId) =>
    set((state) => {
      const next = new Set(state.expandedEnumColumns);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return { expandedEnumColumns: next };
    }),

  setAllEnumsExpanded: (expanded) => {
    if (!expanded) {
      set({ expandedEnumColumns: new Set() });
      return;
    }
    const ids = get().diagram.tables.flatMap((t) =>
      t.columns.filter((c) => isEnumType(c.type)).map((c) => c.id),
    );
    set({ expandedEnumColumns: new Set(ids) });
  },
});
