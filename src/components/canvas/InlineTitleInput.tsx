import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** A borderless input that grows with its text. Enter or blur commits, Escape cancels. */
export function InlineTitleInput({
  initial,
  placeholder = "Untitled",
  onCommit,
  onCancel,
  className,
}: {
  initial: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  // Escape unmounts the input, and a browser may still fire blur on the way out.
  const cancelled = useRef(false);

  return (
    <input
      autoFocus
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => !cancelled.current && onCommit(value.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          onCancel();
        }
      }}
      className={cn(
        "nodrag nopan min-w-16 rounded-md bg-card px-1.5 outline-none field-sizing-content",
        "ring-1 ring-current/40 placeholder:text-current/40",
        className,
      )}
    />
  );
}
