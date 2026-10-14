import { PenLine, Pin, Trash2 } from "lucide-react";
import { SwatchPicker } from "@/components/SwatchPicker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHAPE_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Floating controls for a selected box: colour presets, rename, pin and delete. */
export function BoxToolbar({
  color,
  pinned,
  onColorChange,
  onRename,
  onPinnedChange,
  onDelete,
}: {
  color: string;
  pinned: boolean;
  onColorChange: (color: string) => void;
  onRename: () => void;
  onPinnedChange: (pinned: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 pl-2.5 shadow-md">
      <SwatchPicker
        colors={SHAPE_COLORS}
        value={color}
        onChange={onColorChange}
        label="Section colour"
      />
      <Separator orientation="vertical" className="mx-0.5 !h-5 !self-center" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label="Rename section" onClick={onRename}>
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
            aria-label="Pin section"
            aria-pressed={pinned}
            onClick={() => onPinnedChange(!pinned)}
            className={cn(
              pinned &&
                "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20",
            )}
          >
            <Pin />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {pinned ? "Unpin · lets the section move again" : "Pin · dragging it pans instead"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        {/* A disabled button swallows hover, so the span carries the tooltip. */}
        <TooltipTrigger asChild>
          <span>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete section"
              disabled={pinned}
              className="text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{pinned ? "Unpin to delete" : "Delete ⌫"}</TooltipContent>
      </Tooltip>
    </div>
  );
}
