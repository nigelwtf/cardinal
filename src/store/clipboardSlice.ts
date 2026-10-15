import type { StateCreator } from "zustand";
import { collectClip, instantiateClip, offsetTables, type Clip } from "@/lib/clipboard";
import type { DiagramState } from "./useDiagram";

export interface ClipboardSlice {
  clip: Clip | null;
  /** Take the selected table, as ⌘C does. */
  copySelection: () => void;
  /** Add the copied table beside its original, as ⌘V does. One undo step. */
  pasteClip: () => void;
}

export const createClipboardSlice: StateCreator<DiagramState, [], [], ClipboardSlice> = (
  set,
  get,
) => ({
  clip: null,

  copySelection: () => {
    const { diagram, selection } = get();
    // just one table at a time, for now.
    if (selection.kind !== "table") return;
    set({ clip: collectClip(diagram, [selection.id]) });
  },

  pasteClip: () => {
    const clip = get().clip;
    if (!clip) return;
    const taken = new Set(get().diagram.tables.map((table) => table.name));
    const pasted = instantiateClip(clip, taken);
    const tables = offsetTables(pasted.tables, 48); // arbitrary offset for the pasted table
    get().apply((d) => ({
      ...d,
      tables: [...d.tables, ...tables],
      relationships: [...d.relationships, ...pasted.relationships],
    }));
    const first = tables[0];
    if (first) set({ selection: { kind: "table", id: first.id } });
  },
});
