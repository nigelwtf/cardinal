import type { Point, Size } from "@/lib/types";
import { centeredRect, rectFromCorners, snapRect, type Rect } from "./rect";

/** A press that travels less than this, in flow units, is a click rather than a drag. */
const CLICK_SLOP = 6;

export const isClick = (start: Point, end: Point) =>
  Math.abs(end.x - start.x) < CLICK_SLOP && Math.abs(end.y - start.y) < CLICK_SLOP;

/** The rectangle a draw gesture produces: a click drops a default-sized shape centred on the
 *  cursor, a drag spans the two corners but never below the minimum size. */
export function drawnRect(
  start: Point,
  end: Point,
  { defaultSize, minSize }: { defaultSize: Size; minSize: Size },
): Rect {
  if (isClick(start, end)) return snapRect(centeredRect(start, defaultSize));
  const rect = rectFromCorners(start, end);
  return snapRect({
    ...rect,
    width: Math.max(rect.width, minSize.width),
    height: Math.max(rect.height, minSize.height),
  });
}

/** What to outline while dragging: nothing until the press has become a drag. */
export const previewRect = (
  start: Point,
  end: Point,
  definition: { defaultSize: Size; minSize: Size },
): Rect | null => (isClick(start, end) ? null : drawnRect(start, end, definition));
