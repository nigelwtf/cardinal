import { tableWidth } from "@/lib/layout";
import type { Table } from "@/lib/types";

/**
 * Changes whenever a table's rows can move inside its node: their order, an enum opening or
 * closing, an enum's values changing, or the table's width. The node's height stays at
 * `tableHeight`, so none of these resize it, and React Flow wouldn't otherwise re-read handles.
 */
export const rowLayoutKey = (table: Table, expandedEnumColumns: ReadonlySet<string>) =>
  [
    tableWidth(table),
    ...table.columns.map(
      (column) =>
        `${column.id}:${column.type}:${expandedEnumColumns.has(column.id) ? "open" : "shut"}`,
    ),
  ].join("|");
