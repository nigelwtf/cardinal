import { Position } from "@xyflow/react";
import type { AnchorSide } from "@/lib/types";

export const TABLE_HANDLE = "__table";

/** Only the whole-table handle (the header) renders top/bottom — a column's own row has no
 *  meaningful top/bottom edge of its own, since rows sit flush against their neighbours. */
export const COLUMN_SIDES: AnchorSide[] = ["left", "right"];
export const TABLE_SIDES: AnchorSide[] = ["left", "right", "top", "bottom"];

export const HANDLE_POSITION: Record<AnchorSide, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

export const handleId = (columnId: string, role: "source" | "target", side: AnchorSide) =>
  `${columnId}|${role}|${side}`;

export const columnFromHandle = (handle?: string | null) => {
  if (!handle) return undefined;
  const [columnId] = handle.split("|");
  return columnId === TABLE_HANDLE ? undefined : columnId;
};

export const sideFromHandle = (handle?: string | null): AnchorSide | undefined => {
  const side = handle?.split("|")[2];
  return side === "left" || side === "right" || side === "top" || side === "bottom"
    ? side
    : undefined;
};
