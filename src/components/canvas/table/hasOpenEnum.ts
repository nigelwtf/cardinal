import type { Table } from "@/lib/types";

/** True when one of the table's enums is open, so its rows can wrap onto several lines. */
export const hasOpenEnum = (table: Table, expandedEnumColumns: ReadonlySet<string>) =>
  table.columns.some((column) => expandedEnumColumns.has(column.id));
