import type { NodeHandle } from "@xyflow/react";
import { HEADER_HEIGHT, ROW_HEIGHT, tableHeight, tableWidth } from "@/lib/layout";
import type { AnchorSide, Point, Table } from "@/lib/types";
import {
  COLUMN_SIDES,
  HANDLE_POSITION,
  HANDLE_SIZE,
  TABLE_HANDLE,
  TABLE_SIDES,
  handleId,
} from "./handles";

/** The card's `border` and the rows' `py-1` in `TableNode`, which sit above the first row. */
const CARD_BORDER = 1;
const ROWS_PADDING = 4;
const FIRST_ROW_TOP = CARD_BORDER + HEADER_HEIGHT + ROWS_PADDING;

// The header has no positioning of its own, so its handles sit on the whole node's edges.
const tableHandleCentre = (side: AnchorSide, width: number, height: number): Point =>
  ({
    left: { x: 0, y: height / 2 },
    right: { x: width, y: height / 2 },
    top: { x: width / 2, y: 0 },
    bottom: { x: width / 2, y: height },
  })[side];

const columnHandleCentre = (side: AnchorSide, row: number, width: number): Point => ({
  x: side === "left" ? CARD_BORDER : width - CARD_BORDER,
  y: FIRST_ROW_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2,
});

const handlePair = (anchor: string, side: AnchorSide, centre: Point): NodeHandle[] =>
  (["target", "source"] as const).map((type) => ({
    id: handleId(anchor, type, side),
    type,
    position: HANDLE_POSITION[side],
    x: centre.x - HANDLE_SIZE / 2,
    y: centre.y - HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  }));

/**
 * Where a table node's handles sit while every row is one line high, as React Flow would measure
 * them. Handing these over lets it draw edges to tables it hasn't rendered, so off-screen tables
 * can stay unmounted.
 */
export function tableHandles(table: Table): NodeHandle[] {
  const width = tableWidth(table);
  const height = tableHeight(table);
  return [
    ...TABLE_SIDES.flatMap((side) =>
      handlePair(TABLE_HANDLE, side, tableHandleCentre(side, width, height)),
    ),
    ...table.columns.flatMap((column, row) =>
      COLUMN_SIDES.flatMap((side) =>
        handlePair(column.id, side, columnHandleCentre(side, row, width)),
      ),
    ),
  ];
}
