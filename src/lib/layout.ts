import dagre from "@dagrejs/dagre"
import type { Diagram, Table } from "@/lib/types"

export const NODE_WIDTH = 268
export const HEADER_HEIGHT = 44
export const ROW_HEIGHT = 28
export const FOOTER_HEIGHT = 8

export const tableHeight = (table: Table) =>
  HEADER_HEIGHT + Math.max(table.columns.length, 1) * ROW_HEIGHT + FOOTER_HEIGHT

export type LayoutDirection = "LR" | "TB"

export function autoLayout(diagram: Diagram, direction: LayoutDirection = "LR"): Diagram {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 48 : 72,
    ranksep: direction === "LR" ? 140 : 96,
    marginx: 40,
    marginy: 40,
  })

  for (const table of diagram.tables) {
    graph.setNode(table.id, { width: NODE_WIDTH, height: tableHeight(table) })
  }
  for (const rel of diagram.relationships) {
    if (graph.hasNode(rel.sourceTableId) && graph.hasNode(rel.targetTableId)) {
      graph.setEdge(rel.sourceTableId, rel.targetTableId)
    }
  }

  dagre.layout(graph)

  return {
    ...diagram,
    // Hand-placed bends describe the old routing, so they are dropped on re-layout.
    relationships: diagram.relationships.map(({ waypoints: _dropped, ...rel }) => rel),
    tables: diagram.tables.map((table) => {
      const node = graph.node(table.id)
      if (!node) return table
      return {
        ...table,
        position: { x: Math.round(node.x - NODE_WIDTH / 2), y: Math.round(node.y - tableHeight(table) / 2) },
      }
    }),
    updatedAt: Date.now(),
  }
}

/** Place tables that have never been positioned without disturbing the rest. */
export function placeNewTables(diagram: Diagram): Diagram {
  const unplaced = diagram.tables.filter((t) => t.position.x === 0 && t.position.y === 0)
  if (unplaced.length === 0 || unplaced.length === diagram.tables.length) return diagram

  const maxX = Math.max(...diagram.tables.map((t) => t.position.x + NODE_WIDTH))
  return {
    ...diagram,
    tables: diagram.tables.map((table) => {
      const index = unplaced.indexOf(table)
      if (index === -1) return table
      return { ...table, position: { x: maxX + 80, y: index * 220 } }
    }),
  }
}
