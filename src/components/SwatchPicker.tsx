import { cn } from "@/lib/utils";

/** A row of round colour chips; the chosen one gets a ring. */
export function SwatchPicker({
  colors,
  value,
  onChange,
  label,
}: {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`${label} ${color}`}
          onClick={() => onChange(color)}
          style={{ background: color }}
          className={cn(
            "size-5 rounded-full ring-offset-2 ring-offset-background transition-all",
            value === color ? "ring-2 ring-foreground" : "hover:scale-110",
          )}
        />
      ))}
    </div>
  );
}
