import type { Node } from "@xyflow/react";
import { tableHeight, tableWidth } from "@/lib/layout";
import type { Table } from "@/lib/types";
import type { Selection } from "@/store/useDiagram";
import type { TableNodeData } from "./TableNode";

export const tableNodes = (
  tables: Table[],
  selection: Selection,
  highlightedColumns: string[],
): Node<TableNodeData>[] =>
  tables.map((table) => ({
    id: table.id,
    type: "table",
    position: table.position,
    selected: selection.kind === "table" && selection.id === table.id,
    data: { table, highlightedColumns, dimmed: false },
    width: tableWidth(table),
    height: tableHeight(table),
  }));
