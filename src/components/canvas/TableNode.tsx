import { memo, useEffect, useRef, useState } from "react";
import { useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { ROW_HEIGHT, tableWidth } from "@/lib/layout";
import type { Table } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagram } from "@/store/useDiagram";
import { ColumnRow } from "./table/ColumnRow";
import { hasOpenEnum } from "./table/hasOpenEnum";
import { rowLayoutKey } from "./table/rowLayoutKey";
import { TableHeader } from "./table/TableHeader";

export interface TableNodeData extends Record<string, unknown> {
  table: Table;
  highlightedColumns: string[];
  dimmed: boolean;
}

function TableNodeInner({ id, data, selected }: NodeProps & { data: TableNodeData }) {
  const { table, highlightedColumns, dimmed } = data;
  const highlighted = new Set(highlightedColumns);
  const expandedEnumColumns = useDiagram((s) => s.expandedEnumColumns);
  const toggleEnumExpanded = useDiagram((s) => s.toggleEnumExpanded);
  const updateTable = useDiagram((s) => s.updateTable);
  const [renaming, setRenaming] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const rowLayout = rowLayoutKey(table, expandedEnumColumns);

  // The canvas hands React Flow its measured sizes, so it only re-reads handle positions when a
  // node resizes. Rows can move without a resize, so ask for the re-read when they do. On mount
  // only with an open enum, whose rows may have wrapped while it was off screen: every table
  // re-reading on mount queries the whole DOM hundreds of times.
  const measuredLayout = useRef(hasOpenEnum(table, expandedEnumColumns) ? undefined : rowLayout);
  useEffect(() => {
    if (measuredLayout.current === rowLayout) return;
    measuredLayout.current = rowLayout;
    updateNodeInternals(id);
  }, [rowLayout, id, updateNodeInternals]);

  return (
    <div
      style={{ width: tableWidth(table), borderColor: selected ? undefined : table.accent }}
      className={cn(
        // Width must not animate: React Flow measures handle positions once per size change.
        "group/table rounded-xl border bg-card text-card-foreground shadow-sm transition-[box-shadow,opacity,border-color]",
        "hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/30" : "",
        dimmed && "opacity-35",
      )}
    >
      <TableHeader
        name={table.name}
        accent={table.accent}
        columnCount={table.columns.length}
        editing={renaming}
        onStartEdit={() => setRenaming(true)}
        onCommit={(name) => {
          // A table always has a name, so clearing the field keeps the old one.
          if (name && name !== table.name) updateTable(table.id, { name });
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
      />

      <div className="py-1">
        {table.columns.length === 0 && (
          <div
            className="px-3 text-xs italic text-muted-foreground"
            style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
          >
            no columns
          </div>
        )}
        {table.columns.map((column) => (
          <ColumnRow
            key={column.id}
            column={column}
            highlighted={highlighted.has(column.id)}
            enumExpanded={expandedEnumColumns.has(column.id)}
            onToggleEnum={() => toggleEnumExpanded(column.id)}
          />
        ))}
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeInner);
