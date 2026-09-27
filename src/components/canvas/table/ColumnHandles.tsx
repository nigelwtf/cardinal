import { Handle, Position } from "@xyflow/react";
import { handleId } from "../tableHandles";

const hiddenHandle =
  "!h-2 !w-2 !min-w-0 !min-h-0 !border-0 !bg-transparent opacity-0 transition-opacity";

/** Invisible source and target handles on both sides of a row, for drawing relationships. */
export function ColumnHandles({ id }: { id: string }) {
  return (
    <>
      <Handle
        id={handleId(id, "target", "left")}
        type="target"
        position={Position.Left}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "source", "left")}
        type="source"
        position={Position.Left}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "target", "right")}
        type="target"
        position={Position.Right}
        className={hiddenHandle}
      />
      <Handle
        id={handleId(id, "source", "right")}
        type="source"
        position={Position.Right}
        className={hiddenHandle}
      />
    </>
  );
}
