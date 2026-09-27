import { newId } from "@/lib/id";
import { SHAPE_COLORS, type Shape, type ShapeKind, type Size } from "@/lib/types";
import type { Rect } from "./rect";

type ShapeOf<K extends ShapeKind> = Extract<Shape, { kind: K }>;

interface ShapeDefinition<K extends ShapeKind> {
  /** Size used when the user clicks instead of dragging out a shape. */
  defaultSize: Size;
  /** Smallest size the resizer and the draw tool allow. */
  minSize: Size;
  create: (rect: Rect) => ShapeOf<K>;
}

/** Everything the canvas needs to know to draw a new kind. Adding a kind to `Shape` fails the
 *  build here until it has an entry. */
export const SHAPE_DEFINITIONS: { [K in ShapeKind]: ShapeDefinition<K> } = {
  box: {
    defaultSize: { width: 320, height: 200 },
    minSize: { width: 96, height: 64 },
    create: ({ x, y, width, height }) => ({
      id: newId("shp"),
      kind: "box",
      position: { x, y },
      size: { width, height },
      title: "Untitled",
      color: SHAPE_COLORS[0],
    }),
  },
};

export const createShape = (kind: ShapeKind, rect: Rect): Shape =>
  SHAPE_DEFINITIONS[kind].create(rect);

export const isShapeKind = (value: string): value is ShapeKind =>
  Object.hasOwn(SHAPE_DEFINITIONS, value);
