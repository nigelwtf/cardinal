import { useCallback, useMemo, useRef } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnReconnect,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useDiagram } from "@/store/useDiagram"
import { NODE_WIDTH, tableHeight } from "@/lib/layout"
import { CrowFootMarkers } from "./CrowFootMarkers"
import { RelationshipEdge, type RelationshipEdgeData } from "./RelationshipEdge"
import { TABLE_HANDLE, TableNode, columnFromHandle, handleId, type TableNodeData } from "./TableNode"

const nodeTypes = { table: TableNode }
const edgeTypes = { relationship: RelationshipEdge }

export function Canvas() {
  const diagram = useDiagram((s) => s.diagram)
  const selection = useDiagram((s) => s.selection)
  const select = useDiagram((s) => s.select)
  const moveTable = useDiagram((s) => s.moveTable)
  const addRelationship = useDiagram((s) => s.addRelationship)
  const updateRelationship = useDiagram((s) => s.updateRelationship)
  const removeTable = useDiagram((s) => s.removeTable)
  const removeRelationship = useDiagram((s) => s.removeRelationship)
  const addTable = useDiagram((s) => s.addTable)
  const commitSnapshot = useDiagram((s) => s.commitSnapshot)
  const updateColumn = useDiagram((s) => s.updateColumn)
  const { screenToFlowPosition } = useReactFlow()

  const selectedRelationship = useMemo(
    () =>
      selection.kind === "relationship"
        ? diagram.relationships.find((r) => r.id === selection.id)
        : undefined,
    [diagram.relationships, selection],
  )

  const highlightedColumns = useMemo(
    () =>
      [selectedRelationship?.sourceColumnId, selectedRelationship?.targetColumnId].filter(
        (id): id is string => Boolean(id),
      ),
    [selectedRelationship],
  )

  const nodes: Node<TableNodeData>[] = useMemo(
    () =>
      diagram.tables.map((table) => ({
        id: table.id,
        type: "table",
        position: table.position,
        selected: selection.kind === "table" && selection.id === table.id,
        data: { table, highlightedColumns, dimmed: false },
        width: NODE_WIDTH,
        height: tableHeight(table),
      })),
    [diagram.tables, highlightedColumns, selection],
  )

  const edges: Edge<RelationshipEdgeData>[] = useMemo(() => {
    const byId = new Map(diagram.tables.map((t) => [t.id, t]))
    return diagram.relationships.flatMap((rel) => {
      const source = byId.get(rel.sourceTableId)
      const target = byId.get(rel.targetTableId)
      if (!source || !target) return []

      const sourceRight = source.position.x + NODE_WIDTH / 2 <= target.position.x + NODE_WIDTH / 2
      const sourceSide = sourceRight ? "right" : "left"
      const targetSide = sourceRight ? "left" : "right"

      const anchor = (table: typeof source, columnId?: string) =>
        columnId && table.columns.some((c) => c.id === columnId) ? columnId : TABLE_HANDLE

      return [
        {
          id: rel.id,
          type: "relationship",
          source: rel.sourceTableId,
          target: rel.targetTableId,
          sourceHandle: handleId(anchor(source, rel.sourceColumnId), "source", sourceSide),
          targetHandle: handleId(anchor(target, rel.targetColumnId), "target", targetSide),
          selected: selection.kind === "relationship" && selection.id === rel.id,
          reconnectable: true,
          data: {
            label: rel.label,
            identifying: rel.identifying,
            sourceCardinality: rel.sourceCardinality,
            targetCardinality: rel.targetCardinality,
            waypoints: rel.waypoints,
            dimmed: false,
          },
        },
      ]
    })
  }, [diagram.relationships, diagram.tables, selection])

  // Positions stream in on every pointer move, so history gets one entry per
  // gesture rather than one per frame.
  const dragOrigin = useRef<typeof diagram | null>(null)

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<TableNodeData>>[]) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          moveTable(change.id, change.position, false)
        }
      }
    },
    [moveTable],
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const sourceColumnId = columnFromHandle(connection.sourceHandle)
      const targetColumnId = columnFromHandle(connection.targetHandle)
      const targetTable = diagram.tables.find((t) => t.id === connection.target)
      const sourceTable = diagram.tables.find((t) => t.id === connection.source)

      addRelationship({
        sourceTableId: connection.source,
        targetTableId: connection.target,
        sourceColumnId,
        targetColumnId,
        sourceCardinality: "one",
        targetCardinality: "zero-or-more",
        identifying: true,
        label: sourceTable ? `has ${targetTable?.name.toLowerCase() ?? "rows"}` : "relates to",
      })

      // The many-side column is now a foreign key.
      if (targetColumnId && connection.target) updateColumn(connection.target, targetColumnId, { fk: true })
    },
    [addRelationship, diagram.tables, updateColumn],
  )

  // Dragging an edge end onto a different column re-points the relationship.
  const onReconnect: OnReconnect = useCallback(
    (oldEdge, connection) => {
      if (!connection.source || !connection.target) return
      const targetColumnId = columnFromHandle(connection.targetHandle)
      updateRelationship(oldEdge.id, {
        sourceTableId: connection.source,
        targetTableId: connection.target,
        sourceColumnId: columnFromHandle(connection.sourceHandle),
        targetColumnId,
      })
      if (targetColumnId) updateColumn(connection.target, targetColumnId, { fk: true })
    },
    [updateColumn, updateRelationship],
  )

  return (
    <div className="relative size-full">
      <CrowFootMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        reconnectRadius={16}
        onNodeDragStart={() => {
          dragOrigin.current = useDiagram.getState().diagram
        }}
        onNodeDragStop={() => {
          if (dragOrigin.current) commitSnapshot(dragOrigin.current)
          dragOrigin.current = null
        }}
        onNodeClick={(_, node) => select({ kind: "table", id: node.id })}
        onEdgeClick={(_, edge) => select({ kind: "relationship", id: edge.id })}
        onPaneClick={() => select({ kind: "none" })}
        onNodesDelete={(deleted) => deleted.forEach((n) => removeTable(n.id))}
        onEdgesDelete={(deleted) => deleted.forEach((e) => removeRelationship(e.id))}
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement
          if (!target.classList.contains("react-flow__pane")) return
          addTable(screenToFlowPosition({ x: event.clientX - NODE_WIDTH / 2, y: event.clientY - 20 }))
        }}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        connectionRadius={28}
        defaultEdgeOptions={{ type: "relationship" }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="!bg-muted/30" />
        <Controls showInteractive={false} className="!bottom-4 !left-4 overflow-hidden !rounded-lg !border !border-border !bg-card !shadow-sm [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-foreground hover:[&_button]:!bg-accent" />
        <MiniMap
          pannable
          zoomable
          className="!bottom-4 !right-4 !rounded-lg !border !border-border !bg-card"
          nodeColor={(node) => (node.data as unknown as TableNodeData).table.accent}
          maskColor="color-mix(in oklab, var(--muted) 60%, transparent)"
        />
      </ReactFlow>
    </div>
  )
}
