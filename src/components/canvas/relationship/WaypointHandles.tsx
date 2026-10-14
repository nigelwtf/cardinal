import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "@/lib/types";
import { cn } from "@/lib/utils";

type WaypointHandlesProps = {
  /** The waypoints, in flow coordinates. */
  waypoints: Point[];
  /** The midpoint of each segment, where dragging adds a bend. */
  ghosts: Point[];
  selected: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onBeginDrag: (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
    insert: boolean,
  ) => void;
  onRemove: (index: number) => void;
};

// The handles sit inside React Flow's pane, whose click handler clears the selection.
// That hides the handles, so the second click of a double-click would land on the pane.
const keepSelection = (event: ReactMouseEvent) => event.stopPropagation();

const at = (point: Point) => ({
  transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
});

const handleClass =
  "nodrag nopan pointer-events-auto absolute grid size-6 cursor-grab place-items-center rounded-full active:cursor-grabbing";

/** The dots that move, add and remove a relationship's bends. */
export function WaypointHandles({
  waypoints,
  ghosts,
  selected,
  onEnter,
  onLeave,
  onBeginDrag,
  onRemove,
}: WaypointHandlesProps) {
  const border = selected ? "border-primary" : "border-muted-foreground";
  return (
    <>
      {waypoints.map((point, index) => (
        <button
          key={`waypoint-${index}`}
          type="button"
          aria-label={`Move bend ${index + 1} (double-click to remove)`}
          title="Drag to move · double-click to remove"
          style={at(point)}
          className={handleClass}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onPointerDown={(event) => onBeginDrag(event, index, false)}
          onClick={keepSelection}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onRemove(index);
          }}
        >
          <span
            className={cn(
              "size-2.5 rounded-full border-2 bg-background shadow-sm transition-transform hover:scale-150",
              border,
            )}
          />
        </button>
      ))}

      {ghosts.map((ghost, index) => (
        <button
          key={`ghost-${index}`}
          type="button"
          aria-label="Drag to add a bend"
          title="Drag to add a bend"
          style={at(ghost)}
          className={cn(handleClass, "group/ghost")}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onPointerDown={(event) => onBeginDrag(event, index, true)}
          onClick={keepSelection}
        >
          <span
            className={cn(
              "size-2 rounded-full border border-dashed bg-background/70 opacity-50 transition-all",
              "group-hover/ghost:scale-150 group-hover/ghost:opacity-100",
              border,
            )}
          />
        </button>
      ))}
    </>
  );
}
