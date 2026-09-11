import { memo, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { Cardinality, Point } from "@/lib/types"
import { useDiagram } from "@/store/useDiagram"
import { markerUrl } from "./CrowFootMarkers"
import { STUB, midpoint, segmentAnchors, waypointPath } from "./edgePath"

export interface RelationshipEdgeData extends Record<string, unknown> {
  label: string
  identifying: boolean
  sourceCardinality: Cardinality
  targetCardinality: Cardinality
  waypoints?: Point[]
  dimmed: boolean
}

/** Waypoints land on this grid so hand-drawn routes still line up with each other. */
const GRID = 8
/** How close a drag must come to a neighbour before it snaps into line with it. */
const ALIGN = 7
/** Keeps handles alive while the cursor crosses the gap between the line and a dot. */
const HOVER_GRACE = 140

const snap = (value: number) => Math.round(value / GRID) * GRID

function alignToNeighbours(point: Point, neighbours: Point[]): Point {
  let { x, y } = point
  for (const neighbour of neighbours) {
    if (Math.abs(x - neighbour.x) <= ALIGN) x = neighbour.x
    if (Math.abs(y - neighbour.y) <= ALIGN) y = neighbour.y
  }
  return { x, y }
}

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
  const setWaypoints = useDiagram((s) => s.setWaypoints)
  const commitSnapshot = useDiagram((s) => s.commitSnapshot)
  const { screenToFlowPosition } = useReactFlow()

  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const releaseGesture = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      clearTimeout(hoverTimer.current)
      releaseGesture.current?.()
    },
    [],
  )

  // The dots live in a portal outside this edge's SVG group, so moving the cursor
  // from the line to a dot fires mouseleave. A short grace period bridges the gap.
  const onEnter = useCallback(() => {
    clearTimeout(hoverTimer.current)
    setHovered(true)
  }, [])

  const onLeave = useCallback(() => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHovered(false), HOVER_GRACE)
  }, [])

  const geometry = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }
  const [straightPath, naturalX, naturalY] = getSmoothStepPath({
    ...geometry,
    borderRadius: 12,
    offset: STUB,
  })

  const natural: Point = { x: naturalX, y: naturalY }
  const stored = data?.waypoints ?? []
  // Waypoints are kept relative to the natural midpoint so they follow the tables.
  const absolute = stored.map((point) => ({ x: natural.x + point.x, y: natural.y + point.y }))
  const path = absolute.length ? waypointPath(geometry, absolute) : straightPath
  const anchors = segmentAnchors(geometry, absolute)

  const toRelative = (points: Point[]) =>
    points.map((point) => ({ x: Math.round(point.x - natural.x), y: Math.round(point.y - natural.y) }))

  /**
   * `index` is the waypoint being moved. When `insert` is set the drag creates a new
   * waypoint at that index instead, which is how the ghost dots on each segment work.
   */
  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number, insert: boolean) => {
    event.stopPropagation()
    event.preventDefault()
    releaseGesture.current?.()

    const snapshot = useDiagram.getState().diagram
    const origin = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const startPoints = insert
      ? [...absolute.slice(0, index), midpoint(anchors[index], anchors[index + 1]), ...absolute.slice(index)]
      : absolute
    const start = startPoints[index]
    setDragging(true)

    const onMove = (move: PointerEvent) => {
      const position = screenToFlowPosition({ x: move.clientX, y: move.clientY })
      const next = [...startPoints]
      const raw = {
        x: start.x + position.x - origin.x,
        y: start.y + position.y - origin.y,
      }
      // Alt bypasses the grid for fine positioning.
      const gridded = move.altKey ? raw : { x: snap(raw.x), y: snap(raw.y) }
      next[index] = alignToNeighbours(
        gridded,
        [next[index - 1], next[index + 1], anchors[0], anchors[anchors.length - 1]].filter(
          (point): point is Point => Boolean(point),
        ),
      )
      setWaypoints(id, toRelative(next), false)
    }

    const finish = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
      releaseGesture.current = null
      setDragging(false)
      // One undo entry per gesture, matching how node drags behave.
      commitSnapshot(snapshot)
    }

    releaseGesture.current = finish
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
  }

  const removeWaypoint = (index: number) =>
    setWaypoints(id, toRelative(absolute.filter((_, at) => at !== index)))

  const stroke = selected ? "var(--primary)" : "var(--muted-foreground)"
  const active = Boolean(selected || hovered || dragging)
  const label = data?.label
  const labelAnchor = absolute.length ? absolute[Math.floor((absolute.length - 1) / 2)] : natural

  return (
    <>
      <g onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ opacity: data?.dimmed ? 0.2 : 1 }}>
        {/* Generous invisible hit area — the visible stroke is far too thin to grab. */}
        <path d={path} fill="none" stroke="transparent" strokeWidth={24} strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          className="react-flow__edge-path"
          markerStart={data ? markerUrl(data.sourceCardinality, "start") : undefined}
          markerEnd={data ? markerUrl(data.targetCardinality, "end") : undefined}
          style={{
            stroke,
            strokeWidth: selected ? 2 : 1.5,
            strokeDasharray: data?.identifying === false ? "6 4" : undefined,
          }}
        />
      </g>

      <EdgeLabelRenderer>
        {label && (
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelAnchor.x}px, ${labelAnchor.y - (active ? 16 : 0)}px)` }}
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
          <>
            {absolute.map((point, index) => (
              <button
                key={`waypoint-${index}`}
                type="button"
                aria-label={`Move bend ${index + 1} (double-click to remove)`}
                title="Drag to move · double-click to remove"
                style={{ transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)` }}
                className="nodrag nopan pointer-events-auto absolute grid size-6 cursor-grab place-items-center rounded-full active:cursor-grabbing"
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                onPointerDown={(event) => beginDrag(event, index, false)}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  removeWaypoint(index)
                }}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full border-2 bg-background shadow-sm transition-transform hover:scale-150",
                    selected ? "border-primary" : "border-muted-foreground",
                  )}
                />
              </button>
            ))}

            {anchors.slice(0, -1).map((anchor, index) => {
              const ghost = midpoint(anchor, anchors[index + 1])
              return (
                <button
                  key={`ghost-${index}`}
                  type="button"
                  aria-label="Drag to add a bend"
                  title="Drag to add a bend"
                  style={{ transform: `translate(-50%, -50%) translate(${ghost.x}px, ${ghost.y}px)` }}
                  className="nodrag nopan group/ghost pointer-events-auto absolute grid size-6 cursor-grab place-items-center rounded-full active:cursor-grabbing"
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  onPointerDown={(event) => beginDrag(event, index, true)}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full border border-dashed bg-background/70 opacity-50 transition-all",
                      "group-hover/ghost:scale-150 group-hover/ghost:opacity-100",
                      selected ? "border-primary" : "border-muted-foreground",
                    )}
                  />
                </button>
              )
            })}
          </>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

export const RelationshipEdge = memo(RelationshipEdgeInner)
