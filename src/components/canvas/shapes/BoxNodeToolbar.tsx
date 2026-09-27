import { NodeToolbar, Position, useStore } from "@xyflow/react";
import { useDiagram } from "@/store/useDiagram";
import { TITLE_CLEARANCE } from "./boxStyle";
import { BoxToolbar } from "./BoxToolbar";

/** Keeps the box toolbar clear of the title at any zoom. Mounted only for the selected box, so
 *  only one node follows the zoom level. */
export function BoxNodeToolbar({ id, color }: { id: string; color: string }) {
  const updateBox = useDiagram((s) => s.updateBox);
  const removeShape = useDiagram((s) => s.removeShape);
  const setEditingShape = useDiagram((s) => s.setEditingShape);
  // Toolbar offsets are screen pixels while the title scales with zoom.
  const offset = useStore((s) => 8 + TITLE_CLEARANCE * s.transform[2]);

  return (
    // It portals outside the viewport, so it needs its own layer above the pane.
    <NodeToolbar isVisible position={Position.Top} offset={offset} style={{ zIndex: 10 }}>
      <BoxToolbar
        color={color}
        onColorChange={(next) => updateBox(id, { color: next })}
        onRename={() => setEditingShape(id)}
        onDelete={() => removeShape(id)}
      />
    </NodeToolbar>
  );
}
