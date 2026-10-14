import { useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStore, type ReactFlowState } from "@xyflow/react";

const canvasElement = (state: ReactFlowState) => state.domNode;

/**
 * React Flow's `EdgeLabelRenderer`, minus its cost. That one searches the canvas DOM for its
 * layer on every store update, once per edge, so a large diagram ran hundreds of searches on
 * each zoom frame. This looks the layer up once.
 */
export function EdgeLabelPortal({ children }: { children: ReactNode }) {
  const canvas = useStore(canvasElement);
  const layer = useMemo(() => canvas?.querySelector(".react-flow__edgelabel-renderer"), [canvas]);
  return layer ? createPortal(children, layer) : null;
}
