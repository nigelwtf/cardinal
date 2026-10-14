import type { Point } from "@/lib/types";

/** Waypoints land on this grid so hand-drawn routes still line up with each other. */
const GRID = 8;
/** How close a drag must come to a neighbour before it snaps into line with it. */
const ALIGN = 7;

const snap = (value: number) => Math.round(value / GRID) * GRID;

/** Where a dragged waypoint lands: on the grid unless Alt is held, then in line with neighbours. */
export function snapWaypoint(raw: Point, freehand: boolean, neighbours: Point[]): Point {
  let { x, y } = freehand ? raw : { x: snap(raw.x), y: snap(raw.y) };
  for (const neighbour of neighbours) {
    if (Math.abs(x - neighbour.x) <= ALIGN) x = neighbour.x;
    if (Math.abs(y - neighbour.y) <= ALIGN) y = neighbour.y;
  }
  return { x, y };
}
