import type { Node, NodeChange } from "@xyflow/react";
import type { Size } from "@/lib/types";

/** The size React Flow last measured for each node, by node id. */
export type NodeMeasurements = ReadonlyMap<string, Size>;

/**
 * Folds React Flow's `dimensions` changes in, and drops nodes that no longer exist so deleted ids
 * don't pile up. Returns `measurements` itself when nothing changed.
 */
export function measure(
  measurements: NodeMeasurements,
  changes: NodeChange[],
  exists: (id: string) => boolean,
): NodeMeasurements {
  const sized = changes.filter((change) => change.type === "dimensions" && change.dimensions);
  if (sized.length === 0) return measurements;
  const next = new Map([...measurements].filter(([id]) => exists(id)));
  for (const change of sized) {
    if (change.type === "dimensions" && change.dimensions) next.set(change.id, change.dimensions);
  }
  const same =
    next.size === measurements.size &&
    [...next].every(([id, size]) => {
      const known = measurements.get(id);
      return known?.width === size.width && known.height === size.height;
    });
  return same ? measurements : next;
}

/**
 * Hands each node the size React Flow measured for it. A node rebuilt without `measured` makes
 * React Flow drop its size and handle positions and measure it again a frame later, which costs
 * a layout pass on every edit and leaves a gap where a drag reads an unmeasured node.
 */
export const withMeasurements = <N extends Node>(nodes: N[], measurements: NodeMeasurements) =>
  nodes.map((node) => {
    const measured = measurements.get(node.id);
    return measured ? { ...node, measured } : node;
  });
