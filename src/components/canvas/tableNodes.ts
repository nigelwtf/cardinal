import type { Node } from "@xyflow/react";
import { tableHeight, tableWidth } from "@/lib/layout";
import type { Table } from "@/lib/types";
import type { Selection } from "@/store/useDiagram";
import { hasOpenEnum } from "./table/hasOpenEnum";
import { tableHandles } from "./tableHandles";
import type { TableNodeData } from "./TableNode";

/**
 * React Flow nodes for the tables. An open enum wraps onto lines `tableHandles` can't predict, so
 * such a table keeps the handle positions React Flow last read from it instead. Each node carries
 * its declared size as `measured`: React Flow re-measures a node rebuilt without one, and `fitView`
 * skips unmeasured nodes, which off-screen ones stay while they're unmounted.
 */
export const tableNodes = ({
  tables,
  selection,
  highlightedColumns,
  expandedEnumColumns,
}: {
  tables: Table[];
  selection: Selection;
  highlightedColumns: string[];
  expandedEnumColumns: ReadonlySet<string>;
}): Node<TableNodeData>[] =>
  tables.map((table) => {
    const wraps = hasOpenEnum(table, expandedEnumColumns);
    const width = tableWidth(table);
    const height = tableHeight(table);
    return {
      id: table.id,
      type: "table",
      position: table.position,
      selected: selection.kind === "table" && selection.id === table.id,
      ...(!wraps && { handles: tableHandles(table) }),
      data: { table, highlightedColumns, dimmed: false },
      width,
      height,
      measured: { width, height },
    };
  });
