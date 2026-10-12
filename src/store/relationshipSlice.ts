import type { StateCreator } from "zustand";
import { newId } from "@/lib/id";
import type { Relationship } from "@/lib/types";
import type { DiagramState } from "./useDiagram";

export interface RelationshipSlice {
  addRelationship: (rel: Omit<Relationship, "id">) => void;
  updateRelationship: (id: string, patch: Partial<Relationship>) => void;
  setWaypoints: (id: string, waypoints: Relationship["waypoints"], commit?: boolean) => void;
  removeRelationship: (id: string) => void;
}

export const createRelationshipSlice: StateCreator<DiagramState, [], [], RelationshipSlice> = (
  set,
  get,
) => ({
  addRelationship: (rel) => {
    const id = newId("rel");
    get().apply((d) => ({ ...d, relationships: [...d.relationships, { ...rel, id }] }));
    set({ selection: { kind: "relationship", id } });
  },

  updateRelationship: (id, patch) =>
    get().apply((d) => ({
      ...d,
      relationships: d.relationships.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  setWaypoints: (id, waypoints, commit = true) =>
    get().apply(
      (d) => ({
        ...d,
        relationships: d.relationships.map((r) =>
          r.id === id ? { ...r, waypoints: waypoints?.length ? waypoints : undefined } : r,
        ),
      }),
      { commit },
    ),

  removeRelationship: (id) =>
    get().apply((d) => ({ ...d, relationships: d.relationships.filter((r) => r.id !== id) })),
});
