import { HEADER_HEIGHT } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { InlineTitleInput } from "../InlineTitleInput";
import { TABLE_HANDLE } from "../tableHandles";
import { ColumnHandles } from "./ColumnHandles";

/** A table node's tinted header: its name and column count. Double-click the name to rename. */
export function TableHeader({
  name,
  accent,
  columnCount,
  editing,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  name: string;
  accent: string;
  columnCount: number;
  editing: boolean;
  onStartEdit: () => void;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const text = "text-sm font-semibold tracking-tight";

  return (
    <div
      className="flex items-center gap-2 rounded-t-xl border-b px-3"
      style={{
        height: HEADER_HEIGHT,
        background: `color-mix(in oklab, ${accent} 10%, transparent)`,
      }}
    >
      {editing ? (
        <InlineTitleInput
          initial={name}
          placeholder={name}
          onCommit={onCommit}
          onCancel={onCancel}
          className={cn(text, "-ml-1.5 max-w-full")}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            // Double-clicking empty canvas adds a table; this one shouldn't.
            e.stopPropagation();
            onStartEdit();
          }}
          className={cn(text, "truncate")}
        >
          {name}
        </span>
      )}
      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {columnCount}
      </span>
      <ColumnHandles id={TABLE_HANDLE} />
    </div>
  );
}
