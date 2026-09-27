import { Trash2 } from "lucide-react";
import { SwatchPicker } from "@/components/SwatchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHAPE_COLORS, type BoxShape } from "@/lib/types";

export function BoxInspector({
  box,
  onChange,
  onDelete,
}: {
  box: BoxShape;
  onChange: (patch: Partial<Pick<BoxShape, "title" | "color">>) => void;
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

      <p className="text-xs text-muted-foreground">
        Tables fully inside a section move with it. Deleting the section leaves them where they are.
        Sections save with the document but aren't part of the Mermaid or SQL output.
      </p>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" /> Delete section
      </Button>
    </div>
  );
}
