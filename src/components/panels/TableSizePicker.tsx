import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TABLE_SIZES, type TableSize } from "@/lib/types";

const LABELS: Record<TableSize, { short: string; long: string }> = {
  sm: { short: "S", long: "Small" },
  md: { short: "M", long: "Medium" },
  lg: { short: "L", long: "Large" },
};

export function TableSizePicker({
  value,
  onChange,
}: {
  value: TableSize;
  onChange: (size: TableSize) => void;
}) {
  return (
    <div role="group" aria-label="Table size" className="inline-flex rounded-lg border p-0.5">
      {TABLE_SIZES.map((size) => (
        <Tooltip key={size}>
          <TooltipTrigger asChild>
            <Button
              size="xs"
              variant={size === value ? "secondary" : "ghost"}
              aria-pressed={size === value}
              aria-label={LABELS[size].long}
              className="w-8 font-mono"
              onClick={() => onChange(size)}
            >
              {LABELS[size].short}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{LABELS[size].long}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
