import { tableHeight, tableWidth } from "@/lib/layout";
import type { Diagram, Point, Shape, Table } from "@/lib/types";
import { rectContains, type Rect } from "./rect";

const tableRect = (table: Table): Rect => ({
  ...table.position,
  width: tableWidth(table),
  height: tableHeight(table),
});

const shapeRect = (shape: Shape): Rect => ({ ...shape.position, ...shape.size });

/**
 * Moves a shape to `position` and carries every table and shape that sat fully inside it in
 * `origin`, the document as it was when the gesture began. Membership is read from geometry and
 * never stored, so deleting a shape simply leaves its contents where they are.
 */
export function moveWithContents(
  diagram: Diagram,
  origin: Diagram,
  id: string,
  position: Point,
): Diagram {
  const moved = origin.shapes.find((s) => s.id === id);
  if (!moved) return diagram;

  const frame = shapeRect(moved);
  const dx = position.x - moved.position.x;
  const dy = position.y - moved.position.y;
  const shift = ({ x, y }: Point) => ({ x: x + dx, y: y + dy });

  const tables = new Map(
    origin.tables.filter((t) => rectContains(frame, tableRect(t))).map((t) => [t.id, t.position]),
  );
  const shapes = new Map(
    origin.shapes
      .filter((s) => s.id === id || rectContains(frame, shapeRect(s)))
      .map((s) => [s.id, s.position]),
  );

  return {
    ...diagram,
    tables: diagram.tables.map((t) => {
      const start = tables.get(t.id);
      return start ? { ...t, position: shift(start) } : t;
    }),
    shapes: diagram.shapes.map((s) => {
      const start = shapes.get(s.id);
      return start ? { ...s, position: shift(start) } : s;
    }),
  };
}
