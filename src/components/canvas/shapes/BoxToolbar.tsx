import { PenLine, Trash2 } from "lucide-react";
import { SwatchPicker } from "@/components/SwatchPicker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHAPE_COLORS } from "@/lib/types";

/** Floating controls for a selected box: colour presets, rename and delete. */
export function BoxToolbar({
  color,
  onColorChange,
  onRename,
  onDelete,
}: {
  color: string;
  onColorChange: (color: string) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 pl-2.5 shadow-md">
      <SwatchPicker
        colors={SHAPE_COLORS}
        value={color}
        onChange={onColorChange}
        label="Box colour"
      />
      <Separator orientation="vertical" className="mx-0.5 !h-5 !self-center" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label="Rename box" onClick={onRename}>
            <PenLine />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rename · double-click the title</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Delete box"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete ⌫</TooltipContent>
      </Tooltip>
    </div>
  );
}
