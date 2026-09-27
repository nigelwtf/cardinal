import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Node,
  type NodeChange,
  type OnConnect,
  type OnReconnect,
  useReactFlow,
  useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagram } from "@/store/useDiagram";
import { DEFAULT_TABLE_SIZE, TABLE_WIDTHS } from "@/lib/layout";
import { CanvasTools } from "./CanvasTools";
import { isCanvasSurface, minimapColor, nodeKind, nodeMove } from "./canvasNodes";
import { CrowFootMarkers } from "./CrowFootMarkers";
import { nodeTypes } from "./nodeTypes";
import { RelationshipEdge } from "./RelationshipEdge";
import { relationshipEdges } from "./relationshipEdges";
import { shapeNodes } from "./shapeNodes";
import { columnFromHandle, sideFromHandle } from "./handles";
import { tableNodes } from "./tableNodes";

const edgeTypes = { relationship: RelationshipEdge };

function ZoomBadge() {
  const { zoom } = useViewport();
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium tabular-nums text-foreground shadow-sm">
      {Math.round(zoom * 100)}%
    </div>
  );
}

export function Canvas() {
  const diagram = useDiagram((s) => s.diagram);
  const selection = useDiagram((s) => s.selection);
  const select = useDiagram((s) => s.select);
  const moveTable = useDiagram((s) => s.moveTable);
  const addRelationship = useDiagram((s) => s.addRelationship);
  const updateRelationship = useDiagram((s) => s.updateRelationship);
  const removeTable = useDiagram((s) => s.removeTable);
  const removeRelationship = useDiagram((s) => s.removeRelationship);
  const moveShape = useDiagram((s) => s.moveShape);
  const removeShape = useDiagram((s) => s.removeShape);
  const addTable = useDiagram((s) => s.addTable);
  const beginGesture = useDiagram((s) => s.beginGesture);
  const endGesture = useDiagram((s) => s.endGesture);
  const updateColumn = useDiagram((s) => s.updateColumn);
  const { screenToFlowPosition, getNode } = useReactFlow();

  const selectedRelationship = useMemo(
    () =>
      selection.kind === "relationship"
        ? diagram.relationships.find((r) => r.id === selection.id)
        : undefined,
    [diagram.relationships, selection],
  );

  const highlightedColumns = useMemo(
    () =>
      [selectedRelationship?.sourceColumnId, selectedRelationship?.targetColumnId].filter(
        (id): id is string => Boolean(id),
      ),
    [selectedRelationship],
  );

  // Shapes come first so they paint underneath; their negative z-index keeps them there.
  const nodes: Node[] = useMemo(
    () => [
      ...shapeNodes(diagram.shapes, selection),
      ...tableNodes(diagram.tables, selection, highlightedColumns),
    ],
    [diagram.shapes, diagram.tables, highlightedColumns, selection],
  );

  const edges = useMemo(() => relationshipEdges(diagram, selection), [diagram, selection]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const kindOf = (id: string) => {
        const node = getNode(id);
        return node ? nodeKind(node) : "table";
      };
      for (const change of changes) {
        const move = nodeMove(change, kindOf);
        if (!move) continue;
        const moveNode = move.kind === "shape" ? moveShape : moveTable;
        // Positions stream in on every pointer move; the drag's gesture owns the undo entry.
        moveNode(move.id, move.position, false);
      }
    },
    [getNode, moveShape, moveTable],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const sourceColumnId = columnFromHandle(connection.sourceHandle);
      const targetColumnId = columnFromHandle(connection.targetHandle);
      const targetTable = diagram.tables.find((t) => t.id === connection.target);
      const sourceTable = diagram.tables.find((t) => t.id === connection.source);

      addRelationship({
        sourceTableId: connection.source,
        targetTableId: connection.target,
        sourceColumnId,
        targetColumnId,
        // Pin whichever side the connection was actually dropped on, rather than letting it
        // auto-flip as the tables move — that auto-flip is still what happens when unset.
        sourceSide: sideFromHandle(connection.sourceHandle),
        targetSide: sideFromHandle(connection.targetHandle),
        sourceCardinality: "one",
        targetCardinality: "zero-or-more",
        identifying: true,
        label: sourceTable ? `has ${targetTable?.name.toLowerCase() ?? "rows"}` : "relates to",
      });

      // The many-side column is now a foreign key.
      if (targetColumnId && connection.target)
        updateColumn(connection.target, targetColumnId, { fk: true });
    },
    [addRelationship, diagram.tables, updateColumn],
  );

  // Dragging an edge end onto a different column re-points the relationship.
  const onReconnect: OnReconnect = useCallback(
    (oldEdge, connection) => {
      if (!connection.source || !connection.target) return;
      const targetColumnId = columnFromHandle(connection.targetHandle);
      updateRelationship(oldEdge.id, {
        sourceTableId: connection.source,
        targetTableId: connection.target,
        sourceColumnId: columnFromHandle(connection.sourceHandle),
        targetColumnId,
        sourceSide: sideFromHandle(connection.sourceHandle),
        targetSide: sideFromHandle(connection.targetHandle),
      });
      if (targetColumnId) updateColumn(connection.target, targetColumnId, { fk: true });
    },
    [updateColumn, updateRelationship],
  );

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
        onNodeDragStart={(_, node) => {
          // A drag selects what it grabs, so the inspector and handles follow the pointer.
          select({ kind: nodeKind(node), id: node.id });
          beginGesture();
        }}
        onNodeDragStop={endGesture}
        onNodeClick={(_, node) => select({ kind: nodeKind(node), id: node.id })}
        onEdgeClick={(_, edge) => select({ kind: "relationship", id: edge.id })}
        onPaneClick={() => select({ kind: "none" })}
        onNodesDelete={(deleted) =>
          deleted.forEach((n) => (nodeKind(n) === "shape" ? removeShape(n.id) : removeTable(n.id)))
        }
        onEdgesDelete={(deleted) => deleted.forEach((e) => removeRelationship(e.id))}
        onDoubleClick={(event) => {
          if (!isCanvasSurface(event.target)) return;
          addTable(
            screenToFlowPosition({
              x: event.clientX - TABLE_WIDTHS[DEFAULT_TABLE_SIZE] / 2,
              y: event.clientY - 20,
            }),
          );
        }}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        connectionRadius={28}
        defaultEdgeOptions={{ type: "relationship" }}
        className="bg-transparent"
      >
        <CanvasTools />
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} className="!bg-muted/30" />
        <div className="absolute bottom-4 left-4 z-[5] flex items-end gap-2">
          <Controls
            showInteractive={false}
            className="!static !m-0 overflow-hidden !rounded-lg !border !border-border !bg-card !shadow-sm [&_button]:!border-border [&_button]:!bg-card [&_button]:!text-foreground hover:[&_button]:!bg-accent"
          />
          <ZoomBadge />
        </div>
        <MiniMap
          pannable
          zoomable
          className="!bottom-4 !right-4 !rounded-lg !border !border-border !bg-card"
          nodeColor={minimapColor}
          maskColor="color-mix(in oklab, var(--muted) 60%, transparent)"
        />
      </ReactFlow>
    </div>
  );
}
