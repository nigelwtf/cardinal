import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Fingerprint, KeyRound, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { HEADER_HEIGHT, NODE_WIDTH, ROW_HEIGHT } from "@/lib/layout"
import type { Table } from "@/lib/types"

export const TABLE_HANDLE = "__table"

export const handleId = (columnId: string, role: "source" | "target", side: "left" | "right") =>
  `${columnId}|${role}|${side}`

export const columnFromHandle = (handle?: string | null) => {
  if (!handle) return undefined
  const [columnId] = handle.split("|")
  return columnId === TABLE_HANDLE ? undefined : columnId
}

export interface TableNodeData extends Record<string, unknown> {
  table: Table
  highlightedColumns: string[]
  dimmed: boolean
}

const hiddenHandle =
  "!h-2 !w-2 !min-w-0 !min-h-0 !border-0 !bg-transparent opacity-0 transition-opacity"

function ColumnHandles({ id }: { id: string }) {
  return (
    <>
      <Handle id={handleId(id, "target", "left")} type="target" position={Position.Left} className={hiddenHandle} />
      <Handle id={handleId(id, "source", "left")} type="source" position={Position.Left} className={hiddenHandle} />
      <Handle id={handleId(id, "target", "right")} type="target" position={Position.Right} className={hiddenHandle} />
      <Handle id={handleId(id, "source", "right")} type="source" position={Position.Right} className={hiddenHandle} />
    </>
  )
}

function TableNodeInner({ data, selected }: NodeProps & { data: TableNodeData }) {
  const { table, highlightedColumns, dimmed } = data
  const highlighted = new Set(highlightedColumns)

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
          <div className="px-3 text-xs italic text-muted-foreground" style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}>
            no columns
          </div>
        )}
        {table.columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              "relative flex items-center gap-2 px-3 text-xs",
              highlighted.has(column.id) && "bg-primary/10",
            )}
            style={{ height: ROW_HEIGHT }}
          >
            <span className="flex w-3.5 shrink-0 justify-center">
              {column.pk ? (
                <KeyRound className="size-3 text-amber-500" />
              ) : column.fk ? (
                <Link2 className="size-3 text-sky-500" />
              ) : column.uk ? (
                <Fingerprint className="size-3 text-violet-500" />
              ) : null}
            </span>
            <span className={cn("truncate", column.pk && "font-medium")}>{column.name}</span>
            {column.nullable && !column.pk && <span className="text-muted-foreground/60">?</span>}
            <span className="ml-auto shrink-0 truncate font-mono text-[10px] text-muted-foreground">
              {column.type}
            </span>
            <ColumnHandles id={column.id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export const TableNode = memo(TableNodeInner)
