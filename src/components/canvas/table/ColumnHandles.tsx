import { Handle } from "@xyflow/react";
import type { AnchorSide } from "@/lib/types";
import { COLUMN_SIDES, HANDLE_POSITION, handleId } from "../handles";

const hiddenHandle =
  "!h-2 !w-2 !min-w-0 !min-h-0 !border-0 !bg-transparent opacity-0 transition-opacity";

/** Invisible source and target handles on each given side of a row, for drawing relationships. */
export function ColumnHandles({ id, sides = COLUMN_SIDES }: { id: string; sides?: AnchorSide[] }) {
  return (
    <>
      {sides.flatMap((side) => [
        <Handle
          key={`target-${side}`}
          id={handleId(id, "target", side)}
          type="target"
          position={HANDLE_POSITION[side]}
          className={hiddenHandle}
        />,
        <Handle
          key={`source-${side}`}
          id={handleId(id, "source", side)}
          type="source"
          position={HANDLE_POSITION[side]}
          className={hiddenHandle}
        />,
      ])}
    </>
  );
}
