import { useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ViewportPortal, useReactFlow, useStore } from "@xyflow/react";
import { createShape, SHAPE_DEFINITIONS } from "@/lib/shapes/definitions";
import { drawnRect, previewRect } from "@/lib/shapes/drawnRect";
import type { Point, ShapeKind } from "@/lib/types";
import { useDiagram } from "@/store/useDiagram";

type Gesture = { start: Point; end: Point };

// Pan and zoom listen on the renderer, so the capture surface lives inside it: wheel and pinch
// still bubble up to zoom, while `nopan` stops a press from panning instead of drawing.
const selectRenderer = (s: { domNode: HTMLDivElement | null }) =>
  s.domNode?.querySelector<HTMLElement>(".react-flow__renderer") ?? null;

/** Captures presses over the canvas while a shape tool is active and turns a drag into a shape. */
export function DrawLayer({ kind }: { kind: ShapeKind }) {
  const addShape = useDiagram((s) => s.addShape);
  const { screenToFlowPosition } = useReactFlow();
  const renderer = useStore(selectRenderer);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const definition = SHAPE_DEFINITIONS[kind];
  const preview = gesture && previewRect(gesture.start, gesture.end, definition);

  const toFlow = (event: PointerEvent) =>
    screenToFlowPosition({ x: event.clientX, y: event.clientY });

  if (!renderer) return null;

  return (
    <>
      {createPortal(
        <div
          className="nopan nodrag absolute inset-0 z-[2] cursor-crosshair touch-none"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const start = toFlow(event);
            setGesture({ start, end: start });
          }}
          onPointerMove={(event) => gesture && setGesture({ ...gesture, end: toFlow(event) })}
          onPointerUp={(event) => {
            if (!gesture) return;
            setGesture(null);
            addShape(createShape(kind, drawnRect(gesture.start, toFlow(event), definition)));
          }}
          onPointerCancel={() => setGesture(null)}
        />,
        renderer,
      )}
      {preview && (
        <ViewportPortal>
          <div
            className="pointer-events-none absolute rounded-2xl border-[1.5px] border-dashed border-muted-foreground bg-muted-foreground/10"
            style={{
              transform: `translate(${preview.x}px, ${preview.y}px)`,
              width: preview.width,
              height: preview.height,
            }}
          />
        </ViewportPortal>
      )}
    </>
  );
}
