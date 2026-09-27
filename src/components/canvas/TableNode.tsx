import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { ROW_HEIGHT, tableWidth } from "@/lib/layout";
import type { Table } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDiagram } from "@/store/useDiagram";
import { ColumnRow } from "./table/ColumnRow";
import { TableHeader } from "./table/TableHeader";

export interface TableNodeData extends Record<string, unknown> {
  table: Table;
  highlightedColumns: string[];
  dimmed: boolean;
}

function TableNodeInner({ data, selected }: NodeProps & { data: TableNodeData }) {
  const { table, highlightedColumns, dimmed } = data;
  const highlighted = new Set(highlightedColumns);
  const expandedEnumColumns = useDiagram((s) => s.expandedEnumColumns);
  const toggleEnumExpanded = useDiagram((s) => s.toggleEnumExpanded);
  const updateTable = useDiagram((s) => s.updateTable);
  const [renaming, setRenaming] = useState(false);

  return (
    <div
      style={{ width: tableWidth(table), borderColor: selected ? undefined : table.accent }}
      className={cn(
        // Width must not animate: React Flow measures handle positions once per size change.
        "group/table rounded-xl border bg-card text-card-foreground shadow-sm transition-[box-shadow,opacity,border-color]",
        "hover:shadow-md [&_.react-flow\\_\\_handle]:hover:opacity-100",
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
