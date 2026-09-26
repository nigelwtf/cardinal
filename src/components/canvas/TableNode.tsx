import { memo, useLayoutEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ColumnKeyIcon } from "@/components/ColumnKeyIcon";
import { cn } from "@/lib/utils";
import { isEnumType } from "@/lib/enum";
import { HEADER_HEIGHT, NODE_WIDTH, ROW_HEIGHT } from "@/lib/layout";
import type { Column, Table } from "@/lib/types";
import { useDiagram } from "@/store/useDiagram";

export const TABLE_HANDLE = "__table";

export const handleId = (columnId: string, role: "source" | "target", side: "left" | "right") =>
  `${columnId}|${role}|${side}`;

export const columnFromHandle = (handle?: string | null) => {
  if (!handle) return undefined;
  const [columnId] = handle.split("|");
  return columnId === TABLE_HANDLE ? undefined : columnId;
};

export interface TableNodeData extends Record<string, unknown> {
  table: Table;
  highlightedColumns: string[];
  dimmed: boolean;
}

const hiddenHandle =
  "!h-2 !w-2 !min-w-0 !min-h-0 !border-0 !bg-transparent opacity-0 transition-opacity";

function ColumnHandles({ id }: { id: string }) {
  return (
    <>
      <Handle
        id={handleId(id, "target", "left")}
        type="target"
        position={Position.Left}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "source", "left")}
        type="source"
        position={Position.Left}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "target", "right")}
        type="target"
        position={Position.Right}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "source", "right")}
        type="source"
        position={Position.Right}
        className={hiddenHandle}
      />
    </>
  );
}

/** The type badge for an enum column: clipped to one line with an ellipsis by default, with an
 *  `[expand]` link (shown only once the summary is actually too long to fit) that wraps every
 *  symbol across multiple lines instead of hiding any of them. */
function EnumTypeBadge({
  column,
  expanded,
  onToggle,
}: {
  column: Column;
  expanded: boolean;
  onToggle: () => void;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [column.type, expanded]);

  return (
    <span
      className={cn(
        "flex min-w-0 items-baseline gap-1 font-mono text-[10px] text-muted-foreground",
        expanded ? "flex-1 flex-wrap" : "ml-auto shrink justify-end",
      )}
    >
      <span
        ref={textRef}
        title={!expanded && overflowing ? column.type : undefined}
        className={cn("min-w-0", expanded ? "whitespace-normal break-words" : "truncate")}
      >
        {column.type}
      </span>
      {(expanded || overflowing) && (
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 font-sans font-medium text-primary hover:underline"
        >
          [{expanded ? "shrink" : "expand"}]
        </button>
      )}
    </span>
  );
}

function TableNodeInner({ data, selected }: NodeProps & { data: TableNodeData }) {
  const { table, highlightedColumns, dimmed } = data;
  const highlighted = new Set(highlightedColumns);
  const expandedEnumColumns = useDiagram((s) => s.expandedEnumColumns);
  const toggleEnumExpanded = useDiagram((s) => s.toggleEnumExpanded);

  return (
    <div
      style={{ width: NODE_WIDTH, borderColor: selected ? undefined : table.accent }}
      className={cn(
        "group/table rounded-xl border bg-card text-card-foreground shadow-sm transition-all",
        "hover:shadow-md [&_.react-flow\\_\\_handle]:hover:opacity-100",
        selected ? "border-primary ring-2 ring-primary/30" : "",
        dimmed && "opacity-35",
      )}
    >
      <div
        className="flex items-center gap-2 rounded-t-xl border-b px-3"
        style={{
          height: HEADER_HEIGHT,
          background: `color-mix(in oklab, ${table.accent} 10%, transparent)`,
        }}
      >
        <span className="truncate text-sm font-semibold tracking-tight">{table.name}</span>
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {table.columns.length}
        </span>
        <ColumnHandles id={TABLE_HANDLE} />
      </div>

      <div className="py-1">
        {table.columns.length === 0 && (
          <div
            className="px-3 text-xs italic text-muted-foreground"
            style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
          >
            no columns
          </div>
        )}
        {table.columns.map((column) => {
          const enumType = isEnumType(column.type);
          const expanded = enumType && expandedEnumColumns.has(column.id);
          return (
            <div
              key={column.id}
              className={cn(
                "relative flex gap-2 px-3 text-xs",
                expanded ? "items-start py-1" : "items-center",
                highlighted.has(column.id) && "bg-primary/10",
              )}
              style={expanded ? { minHeight: ROW_HEIGHT } : { height: ROW_HEIGHT }}
            >
              <span
                className="flex w-3.5 shrink-0 items-center justify-center"
                style={{ height: ROW_HEIGHT }}
              >
                <ColumnKeyIcon pk={column.pk} fk={column.fk} uk={column.uk} className="size-3" />
              </span>
              <span className={cn("truncate", column.pk && "font-medium", enumType && "shrink-0")}>
                {column.name}
              </span>
              {column.nullable && !column.pk && (
                <span className="shrink-0 text-muted-foreground/60">?</span>
              )}
              {enumType ? (
                <EnumTypeBadge
                  column={column}
                  expanded={expanded}
                  onToggle={() => toggleEnumExpanded(column.id)}
                />
              ) : (
                <span
                  className="ml-auto shrink-0 truncate font-mono text-[10px] text-muted-foreground"
                  title={column.type}
                >
                  {column.type}
                </span>
              )}
              <ColumnHandles id={column.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeInner);
