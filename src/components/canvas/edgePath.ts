import { Position } from "@xyflow/react"
import type { Point } from "@/lib/types"

export interface EdgeGeometry {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
}

export type { Point }

/** Length of the straight run that leaves a table before the path is allowed to turn. */
export const STUB = 28
const CORNER_RADIUS = 12

const DIRECTION: Record<Position, Point> = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
}

const step = (from: Point, position: Position): Point => ({
  x: from.x + DIRECTION[position].x * STUB,
  y: from.y + DIRECTION[position].y * STUB,
})

const same = (a: Point, b: Point) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5

/** Drop duplicate and perfectly collinear points so corner rounding has real corners to work with. */
function simplify(points: Point[]): Point[] {
  const out: Point[] = []
  for (const point of points) {
    if (out.length && same(out[out.length - 1], point)) continue
    out.push(point)
  }
  for (let i = out.length - 2; i > 0; i--) {
    const [previous, current, next] = [out[i - 1], out[i], out[i + 1]]
    const collinear =
      (Math.abs(previous.x - current.x) < 0.5 && Math.abs(current.x - next.x) < 0.5) ||
      (Math.abs(previous.y - current.y) < 0.5 && Math.abs(current.y - next.y) < 0.5)
    if (collinear) out.splice(i, 1)
  }
  return out
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)

const towards = (from: Point, to: Point, length: number): Point => {
  const total = distance(from, to) || 1
  const ratio = Math.min(length, total) / total
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
}

/** Render a polyline with quadratic corners, matching the look of React Flow's smoothstep edges. */
function roundedPolyline(points: Point[]): string {
  if (points.length < 2) return ""
  let path = `M ${points[0].x},${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const [previous, corner, next] = [points[i - 1], points[i], points[i + 1]]
    const radius = Math.min(
      CORNER_RADIUS,
      distance(previous, corner) / 2,
      distance(corner, next) / 2,
    )
    const enter = towards(corner, previous, radius)
    const exit = towards(corner, next, radius)
    path += ` L ${enter.x},${enter.y} Q ${corner.x},${corner.y} ${exit.x},${exit.y}`
  }

  const last = points[points.length - 1]
  return `${path} L ${last.x},${last.y}`
}

/**
 * Route an orthogonal path from source to target through every waypoint in order.
 * Both tables keep their straight stub, and each leg turns horizontally first so
 * the shape stays predictable as points are added.
 */
export function waypointPath(geometry: EdgeGeometry, waypoints: Point[]): string {
  const source = { x: geometry.sourceX, y: geometry.sourceY }
  const target = { x: geometry.targetX, y: geometry.targetY }
  const fromSource = step(source, geometry.sourcePosition)
  const toTarget = step(target, geometry.targetPosition)

  const points: Point[] = [source, fromSource]
  let cursor = fromSource
  for (const waypoint of [...waypoints, toTarget]) {
    points.push({ x: waypoint.x, y: cursor.y }, waypoint)
    cursor = waypoint
  }
  points.push(target)

  return roundedPolyline(simplify(points))
}

/** Anchors the draggable handles hang off: the source, each waypoint, then the target. */
export function segmentAnchors(geometry: EdgeGeometry, waypoints: Point[]): Point[] {
  return [
    { x: geometry.sourceX, y: geometry.sourceY },
    ...waypoints,
    { x: geometry.targetX, y: geometry.targetY },
  ]
}

export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
