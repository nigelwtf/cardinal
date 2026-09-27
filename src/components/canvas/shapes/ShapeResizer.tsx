import { NodeResizer, ViewportPortal, type OnResize } from "@xyflow/react";
import type { Rect } from "@/lib/shapes/rect";
import type { Size } from "@/lib/types";

/** Resize handles for a shape, lifted into the layer above the nodes. Shapes sit behind the
 *  tables, so handles drawn inside the shape would be unreachable wherever a table overlaps it. */
export function ShapeResizer({
  nodeId,
  rect,
  color,
  minSize,
  onResizeStart,
  onResize,
  onResizeEnd,
}: {
  nodeId: string;
  rect: Rect;
  color: string;
  minSize: Size;
  onResizeStart: () => void;
  onResize: (rect: Rect) => void;
  onResizeEnd: () => void;
}) {
  const handleResize: OnResize = (_, { x, y, width, height }) => onResize({ x, y, width, height });

  return (
    <ViewportPortal>
      <div
        className="pointer-events-none absolute [&_.react-flow\_\_resize-control]:pointer-events-auto"
        style={{
          transform: `translate(${rect.x}px, ${rect.y}px)`,
          width: rect.width,
          height: rect.height,
        }}
      >
        <NodeResizer
          nodeId={nodeId}
          minWidth={minSize.width}
          minHeight={minSize.height}
          color={color}
          handleClassName="!size-2.5 !rounded-full !border-2 !bg-background"
          lineClassName="!border-transparent"
          onResizeStart={onResizeStart}
          onResize={handleResize}
          onResizeEnd={onResizeEnd}
        />
      </div>
    </ViewportPortal>
  );
}
