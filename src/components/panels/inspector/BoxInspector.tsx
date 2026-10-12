import { Trash2 } from "lucide-react";
import { SwatchPicker } from "@/components/SwatchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SHAPE_COLORS, type BoxShape } from "@/lib/types";

export function BoxInspector({
  box,
  onChange,
  onDelete,
}: {
  box: BoxShape;
  onChange: (patch: Partial<Pick<BoxShape, "title" | "color" | "pinned">>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input
          value={box.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Untitled"
          className="h-8"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Colour</Label>
        <SwatchPicker
          colors={SHAPE_COLORS}
          value={box.color}
          onChange={(color) => onChange({ color })}
          label="Section colour"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2">
        <div>
          <Label className="text-xs">Pinned</Label>
          <p className="text-[10px] text-muted-foreground">
            Can't be moved, resized or deleted. Dragging it pans.
          </p>
        </div>
        <Switch checked={box.pinned === true} onCheckedChange={(pinned) => onChange({ pinned })} />
      </div>

      <p className="text-xs text-muted-foreground">
        Tables fully inside a section move with it. Deleting the section leaves them where they are.
        Sections save with the document but aren't part of the Mermaid or SQL output.
      </p>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-destructive hover:text-destructive"
        disabled={box.pinned}
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" /> {box.pinned ? "Unpin to delete" : "Delete section"}
      </Button>
    </div>
  );
}
