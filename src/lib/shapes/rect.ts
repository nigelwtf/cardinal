import type { Point, Size } from "@/lib/types";

export type Rect = Point & Size;

/** Shapes land on the same 8px grid as relationship bends, so edges line up with them. */
export const SHAPE_GRID = 8;

const snap = (value: number, grid: number) => Math.round(value / grid) * grid;

export const snapPoint = ({ x, y }: Point, grid = SHAPE_GRID): Point => ({
  x: snap(x, grid),
  y: snap(y, grid),
});

/** The rectangle spanned by two opposite corners, in whichever order they were dragged. */
export const rectFromCorners = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
});

// Edges are snapped rather than origin and size, so dragging one side never nudges the other.
export const snapRect = (rect: Rect, grid = SHAPE_GRID): Rect => {
  const x = snap(rect.x, grid);
  const y = snap(rect.y, grid);
  return {
    x,
    y,
    width: snap(rect.x + rect.width, grid) - x,
    height: snap(rect.y + rect.height, grid) - y,
  };
};

export const rectContains = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

export const centeredRect = (center: Point, size: Size): Rect => ({
  x: center.x - size.width / 2,
  y: center.y - size.height / 2,
  ...size,
});
