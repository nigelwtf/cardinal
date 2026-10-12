import { ChevronRight, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TableRowProps = {
  name: string;
  accent: string;
  /** How many relationships reach the table. */
  degree: number;
  selected: boolean;
  open: boolean;
  onFocus: () => void;
  onToggle: () => void;
};

/** One table in the Explorer list: its name, its accent and how many links it has. */
export function TableRow({
  name,
  accent,
  degree,
  selected,
  open,
  onFocus,
  onToggle,
}: TableRowProps) {
  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
      onClick={onFocus}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex size-4 shrink-0 items-center justify-center rounded hover:bg-background/60"
      >
        <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
      </button>
      <span className="size-2 shrink-0 rounded-full" style={{ background: accent }} />
      <Table2 className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{name}</span>
      <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {degree ? `${degree}↔` : ""}
      </span>
    </div>
  );
}
