import { ColumnKeyIcon } from "@/components/ColumnKeyIcon";
import { isEnumType } from "@/lib/enum";
import { ROW_HEIGHT } from "@/lib/layout";
import type { Column } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ColumnHandles } from "./ColumnHandles";
import { EnumTypeBadge } from "./EnumTypeBadge";

/** One column of a table node: key icon, name, nullability and type, with its connection handles. */
export function ColumnRow({
  column,
  highlighted,
  enumExpanded,
  onToggleEnum,
}: {
  column: Column;
  highlighted: boolean;
  enumExpanded: boolean;
  onToggleEnum: () => void;
}) {
  const enumType = isEnumType(column.type);
  const expanded = enumType && enumExpanded;

  return (
    <div
      className={cn(
        "relative flex gap-2 px-3 text-xs",
        expanded ? "items-start py-1" : "items-center",
        highlighted && "bg-primary/10",
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
        <EnumTypeBadge type={column.type} expanded={expanded} onToggle={onToggleEnum} />
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
}
