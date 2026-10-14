import { ColumnKeyIcon } from "@/components/ColumnKeyIcon";
import type { Column } from "@/lib/types";

/** The columns of a table opened in the Explorer list. */
export function TableColumns({ columns }: { columns: Column[] }) {
  return (
    <div className="ml-6 border-l border-border/60 pl-2">
      {columns.map((column) => (
        <div key={column.id} className="flex items-center gap-1.5 py-0.5 text-[11px]">
          <ColumnKeyIcon
            pk={column.pk}
            fk={column.fk}
            className="size-2.5"
            placeholder={<span className="size-2.5 shrink-0" />}
          />
          <span className="truncate">{column.name}</span>
          <span className="ml-auto shrink-0 font-mono text-[9px] text-muted-foreground">
            {column.type}
          </span>
        </div>
      ))}
    </div>
  );
}
