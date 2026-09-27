import { useDiagram } from "@/store/useDiagram";
import { BoxInspector } from "./BoxInspector";

export function ShapeInspector({ id }: { id: string }) {
  const shape = useDiagram((s) => s.diagram.shapes.find((shape) => shape.id === id));
  const updateBox = useDiagram((s) => s.updateBox);
  const removeShape = useDiagram((s) => s.removeShape);
  if (!shape) return null;

  switch (shape.kind) {
    case "box":
      return (
        <BoxInspector
          box={shape}
          onChange={(patch) => updateBox(id, patch)}
          onDelete={() => removeShape(id)}
        />
      );
    default: {
      const _exhaustive: never = shape.kind;
      return _exhaustive;
    }
  }
}
