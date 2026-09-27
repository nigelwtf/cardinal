import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** The type badge for an enum column: clipped to one line with an ellipsis by default, with an
 *  `[expand]` link (shown only once the summary is actually too long to fit) that wraps every
 *  symbol across multiple lines instead of hiding any of them. */
export function EnumTypeBadge({
  type,
  expanded,
  onToggle,
}: {
  type: string;
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
  }, [type, expanded]);

  return (
    <span
      className={cn(
        "flex min-w-0 items-baseline gap-1 font-mono text-[10px] text-muted-foreground",
        expanded ? "flex-1 flex-wrap" : "ml-auto shrink justify-end",
      )}
    >
      <span
        ref={textRef}
        title={!expanded && overflowing ? type : undefined}
        className={cn("min-w-0", expanded ? "whitespace-normal break-words" : "truncate")}
      >
        {type}
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
