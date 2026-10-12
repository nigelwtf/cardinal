import type { CSSProperties } from "react";
import { Handle } from "@xyflow/react";
import type { AnchorSide } from "@/lib/types";
import { COLUMN_SIDES, HANDLE_POSITION, HANDLE_SIZE, handleId } from "../handles";

const half = -HANDLE_SIZE / 2;

/**
 * Centres each handle on its edge with margins in place of React Flow's `translate`. A transform
 * on every one of thousands of handles gives the browser that many layers to sort on every pan
 * frame, which is most of what made a large diagram stutter.
 */
const centred: Record<AnchorSide, CSSProperties> = {
  left: { marginTop: half, marginLeft: half },
  right: { marginTop: half, marginRight: half },
  top: { marginTop: half, marginLeft: half },
  bottom: { marginBottom: half, marginLeft: half },
};

const handleClass = "!min-w-0 !min-h-0 !border-0 !bg-transparent";

/** Invisible source and target handles on each given side of a row, for drawing relationships. */
export function ColumnHandles({ id, sides = COLUMN_SIDES }: { id: string; sides?: AnchorSide[] }) {
  return (
    <>
      {sides.flatMap((side) => {
        const style = {
          ...centred[side],
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          transform: "none",
        };
        return [
          <Handle
            key={`target-${side}`}
            id={handleId(id, "target", side)}
            type="target"
            position={HANDLE_POSITION[side]}
            className={handleClass}
            style={style}
          />,
          <Handle
            key={`source-${side}`}
            id={handleId(id, "source", side)}
            type="source"
            position={HANDLE_POSITION[side]}
            className={handleClass}
            style={style}
          />,
        ];
      })}
    </>
  );
}
