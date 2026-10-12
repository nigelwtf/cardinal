import type { StateCreator } from "zustand";
import { newId } from "@/lib/id";
import type { Diagram, Relationship } from "@/lib/types";
import { mapTable, patchColumn } from "./tableSlice";
import type { DiagramState } from "./useDiagram";

type RelationshipEnds = Pick<
  Relationship,
  | "sourceTableId"
  | "targetTableId"
  | "sourceColumnId"
  | "targetColumnId"
  | "sourceSide"
  | "targetSide"
>;

export interface RelationshipSlice {
  /** Add a drawn relationship and make its many-side column a foreign key, as one step. */
  connectTables: (rel: Omit<Relationship, "id">) => void;
  /** Move a relationship's ends and make the new many-side column a foreign key, as one step. */
  repointRelationship: (id: string, ends: RelationshipEnds) => void;
  updateRelationship: (id: string, patch: Partial<Relationship>) => void;
  setWaypoints: (id: string, waypoints: Relationship["waypoints"], commit?: boolean) => void;
  removeRelationship: (id: string) => void;
}

const markForeignKey = (d: Diagram, { targetTableId, targetColumnId }: RelationshipEnds) =>
  targetColumnId
    ? mapTable(d, targetTableId, (t) => patchColumn(t, targetColumnId, { fk: true }))
    : d;

export const createRelationshipSlice: StateCreator<DiagramState, [], [], RelationshipSlice> = (
  set,
  get,
) => ({
  connectTables: (rel) => {
    const id = newId("rel");
    get().apply((d) =>
      markForeignKey({ ...d, relationships: [...d.relationships, { ...rel, id }] }, rel),
    );
    set({ selection: { kind: "relationship", id } });
  },

  repointRelationship: (id, ends) =>
    get().apply((d) =>
      markForeignKey(
        { ...d, relationships: d.relationships.map((r) => (r.id === id ? { ...r, ...ends } : r)) },
        ends,
      ),
    ),

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

  removeRelationship: (id) => get().removeItems({ relationships: [id] }),
});
