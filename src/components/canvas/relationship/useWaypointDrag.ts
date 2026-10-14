import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Point } from "@/lib/types";
import { useDiagram } from "@/store/useDiagram";
import { midpoint } from "../edgePath";
import { snapWaypoint } from "./waypointSnap";

type WaypointGeometry = {
  /** The path's natural midpoint, which stored waypoints are relative to. */
  natural: Point;
  /** The waypoints in flow coordinates. */
  absolute: Point[];
  /** Each segment's ends, from the source handle through every waypoint to the target. */
  anchors: Point[];
};

/**
 * Dragging, adding and removing a relationship's waypoints. A drag is one undo step, and one
 * left running when the edge unmounts is closed rather than leaked.
 */
export function useWaypointDrag(id: string, { natural, absolute, anchors }: WaypointGeometry) {
  const setWaypoints = useDiagram((s) => s.setWaypoints);
  const beginGesture = useDiagram((s) => s.beginGesture);
  const endGesture = useDiagram((s) => s.endGesture);
  const { screenToFlowPosition } = useReactFlow();
  const [dragging, setDragging] = useState(false);
  const releaseGesture = useRef<(() => void) | null>(null);

  useEffect(() => () => releaseGesture.current?.(), []);

  const toRelative = (points: Point[]) =>
    points.map((point) => ({
      x: Math.round(point.x - natural.x),
      y: Math.round(point.y - natural.y),
    }));

  /**
   * `index` is the waypoint being moved. When `insert` is set the drag creates a new waypoint at
   * that index instead, which is how the ghost dots on each segment work.
   */
  const beginDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
    insert: boolean,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    releaseGesture.current?.();

    beginGesture();
    const origin = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const startPoints = insert
      ? [
          ...absolute.slice(0, index),
          midpoint(anchors[index], anchors[index + 1]),
          ...absolute.slice(index),
        ]
      : absolute;
    const start = startPoints[index];
    setDragging(true);

    const onMove = (move: PointerEvent) => {
      const position = screenToFlowPosition({ x: move.clientX, y: move.clientY });
      const next = [...startPoints];
      const raw = { x: start.x + position.x - origin.x, y: start.y + position.y - origin.y };
      const neighbours = [next[index - 1], next[index + 1], anchors[0], anchors.at(-1)];
      // Alt bypasses the grid for fine positioning.
      next[index] = snapWaypoint(
        raw,
        move.altKey,
        neighbours.filter((point): point is Point => Boolean(point)),
      );
      setWaypoints(id, toRelative(next), false);
    };

    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      releaseGesture.current = null;
      setDragging(false);
      // One undo entry per gesture, matching how node drags behave.
      endGesture();
    };

    releaseGesture.current = finish;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const removeWaypoint = (index: number) =>
    setWaypoints(id, toRelative(absolute.filter((_, at) => at !== index)));

  return { dragging, beginDrag, removeWaypoint };
}
