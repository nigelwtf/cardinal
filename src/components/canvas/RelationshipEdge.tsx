import { memo, useCallback, useEffect, useRef, useState } from "react";
import { EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { Cardinality, Point } from "@/lib/types";
import { STUB, midpoint, segmentAnchors, waypointPath } from "./edgePath";
import { RelationshipPath } from "./relationship/RelationshipPath";
import { useWaypointDrag } from "./relationship/useWaypointDrag";
import { WaypointHandles } from "./relationship/WaypointHandles";

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string;
  identifying: boolean;
  sourceCardinality: Cardinality;
  targetCardinality: Cardinality;
  waypoints?: Point[];
  dimmed: boolean;
}

/** Keeps handles alive while the cursor crosses the gap between the line and a dot. */
const HOVER_GRACE = 140;

function RelationshipEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps & { data?: RelationshipEdgeData }) {
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // The dots live in a portal outside this edge's SVG group, so moving the cursor
  // from the line to a dot fires mouseleave. A short grace period bridges the gap.
  const onEnter = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setHovered(true);
  }, []);

  const onLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(false), HOVER_GRACE);
  }, []);

  const geometry = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  const [straightPath, naturalX, naturalY] = getSmoothStepPath({
    ...geometry,
    borderRadius: 12,
    offset: STUB,
  });

  const natural: Point = { x: naturalX, y: naturalY };
  const stored = data?.waypoints ?? [];
  // Waypoints are kept relative to the natural midpoint so they follow the tables.
  const absolute = stored.map((point) => ({ x: natural.x + point.x, y: natural.y + point.y }));
  const path = absolute.length ? waypointPath(geometry, absolute) : straightPath;
  const anchors = segmentAnchors(geometry, absolute);
  const { dragging, beginDrag, removeWaypoint } = useWaypointDrag(id, {
    natural,
    absolute,
    anchors,
  });

  const active = Boolean(selected || hovered || dragging);
  const label = data?.label;
  const labelAnchor = absolute.length ? absolute[Math.floor((absolute.length - 1) / 2)] : natural;

  return (
    <>
      <RelationshipPath
        path={path}
        selected={Boolean(selected)}
        identifying={data?.identifying}
        dimmed={data?.dimmed}
        cardinalities={data && { source: data.sourceCardinality, target: data.targetCardinality }}
        onEnter={onEnter}
        onLeave={onLeave}
      />

      <EdgeLabelRenderer>
        {label && (
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelAnchor.x}px, ${labelAnchor.y - (active ? 16 : 0)}px)`,
            }}
            className={cn(
              "pointer-events-none absolute rounded-full border bg-background/90 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm transition-transform",
              selected ? "border-primary text-primary" : "border-border text-muted-foreground",
              data?.dimmed && "opacity-20",
            )}
          >
            {label}
          </div>
        )}

        {active && (
          <WaypointHandles
            waypoints={absolute}
            ghosts={anchors
              .slice(0, -1)
              .map((anchor, index) => midpoint(anchor, anchors[index + 1]))}
            selected={Boolean(selected)}
            onEnter={onEnter}
            onLeave={onLeave}
            onBeginDrag={beginDrag}
            onRemove={removeWaypoint}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeInner);
