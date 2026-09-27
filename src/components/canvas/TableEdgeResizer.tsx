import { useRef } from "react";
import { NodeResizeControl, ResizeControlVariant } from "@xyflow/react";
import { MAX_TABLE_WIDTH, MIN_TABLE_WIDTH } from "@/lib/layout";
import type { Diagram } from "@/lib/types";
import { useDiagram } from "@/store/useDiagram";

const edgeLine = [
  "z-10 !w-3 !border-0 after:absolute after:inset-y-3 after:left-1/2 after:w-0.5 after:-translate-x-1/2",
  "after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity",
  "group-hover/table:after:opacity-40 hover:after:!opacity-100",
].join(" ");

/** Drag either side of a table to change its width; double-click to reset it. */
export function TableEdgeResizer({ tableId }: { tableId: string }) {
  const resizeTable = useDiagram((s) => s.resizeTable);
  const updateTable = useDiagram((s) => s.updateTable);
  const commitSnapshot = useDiagram((s) => s.commitSnapshot);
  // One undo entry per gesture, as with dragging a table.
  const origin = useRef<Diagram | null>(null);

  const control = (position: "left" | "right") => (
    <NodeResizeControl
      key={position}
      position={position}
      variant={ResizeControlVariant.Line}
      minWidth={MIN_TABLE_WIDTH}
      maxWidth={MAX_TABLE_WIDTH}
      className={edgeLine}
      onResizeStart={() => {
        origin.current = useDiagram.getState().diagram;
      }}
      onResize={(_, { x, width }) => resizeTable(tableId, { x, width }, false)}
      onResizeEnd={() => {
        if (origin.current) commitSnapshot(origin.current);
        origin.current = null;
      }}
    />
  );

  return (
    <span
      className="contents"
      onDoubleClick={(event) => {
        event.stopPropagation();
        updateTable(tableId, { width: undefined });
      }}
    >
      {control("left")}
      {control("right")}
    </span>
  );
}
