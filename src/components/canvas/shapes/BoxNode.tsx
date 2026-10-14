import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { SHAPE_DEFINITIONS } from "@/lib/shapes/definitions";
import { snapRect } from "@/lib/shapes/rect";
import { cn } from "@/lib/utils";
import { useDiagram } from "@/store/useDiagram";
import type { ShapeNode } from "../shapeNodes";
import { BoxFrame } from "./BoxFrame";
import { BoxNodeToolbar } from "./BoxNodeToolbar";
import { BoxTitle } from "./BoxTitle";
import { ShapeResizer } from "./ShapeResizer";

const { minSize } = SHAPE_DEFINITIONS.box;

function BoxNodeInner({ id, data, selected }: NodeProps<ShapeNode<"box">>) {
  const { shape } = data;
  const pinned = shape.pinned === true;
  const editing = useDiagram((s) => s.editingShapeId === id);
  const setEditingShape = useDiagram((s) => s.setEditingShape);
  const updateBox = useDiagram((s) => s.updateBox);
  const resizeShape = useDiagram((s) => s.resizeShape);
  const beginGesture = useDiagram((s) => s.beginGesture);
  const endGesture = useDiagram((s) => s.endGesture);

  return (
    <>
      {selected && (
        <>
          {!pinned && (
            <ShapeResizer
              nodeId={id}
              rect={{ ...shape.position, ...shape.size }}
              color={shape.color}
              minSize={minSize}
              onResizeStart={beginGesture}
              onResize={(rect) => resizeShape(id, snapRect(rect), false)}
              onResizeEnd={endGesture}
            />
          )}
          <BoxNodeToolbar id={id} color={shape.color} pinned={pinned} />
        </>
      )}
      <BoxFrame
        color={shape.color}
        selected={selected}
        className={cn(pinned && "cursor-grab active:cursor-grabbing")}
      />
      <BoxTitle
        title={shape.title}
        color={shape.color}
        selected={selected}
        pinned={pinned}
        editing={editing}
        onStartEdit={() => setEditingShape(id)}
        onCommit={(title) => {
          if (title !== shape.title) updateBox(id, { title });
          setEditingShape(null);
        }}
        onCancel={() => setEditingShape(null)}
      />
    </>
  );
}

export const BoxNode = memo(BoxNodeInner);
