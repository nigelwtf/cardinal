import { cn } from "@/lib/utils";
import { TITLE_CLEARANCE } from "./boxStyle";
import { InlineTitleInput } from "./InlineTitleInput";

/** The box's name, centred just above its top edge in the box colour. Double-click to rename. */
export function BoxTitle({
  title,
  color,
  selected,
  editing,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  title: string;
  color: string;
  selected: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onCommit: (title: string) => void;
  onCancel: () => void;
}) {
  const text = "text-[15px] leading-6 font-semibold tracking-tight";

  return (
    <div
      className="absolute bottom-full left-0 flex w-full items-start justify-center"
      style={{ color, height: TITLE_CLEARANCE }}
    >
      {editing ? (
        <InlineTitleInput
          initial={title}
          onCommit={onCommit}
          onCancel={onCancel}
          className={text}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className={cn(text, "max-w-full cursor-text truncate px-1.5")}
        >
          {title || (selected ? <span className="opacity-50">Add title</span> : null)}
        </span>
      )}
    </div>
  );
}
