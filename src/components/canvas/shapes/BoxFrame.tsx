import { cn } from "@/lib/utils";
import { boxPaint } from "./boxStyle";

/** The tinted, bordered rectangle of a box, filling its parent. */
export function BoxFrame({
  color,
  selected = false,
  className,
}: {
  color: string;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      data-shape-surface
      style={boxPaint(color, selected)}
      className={cn(
        "size-full rounded-2xl border-[1.5px] transition-[border-color,box-shadow]",
        className,
      )}
    />
  );
}
