import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useReactFlow } from "@xyflow/react";
import { isTyping } from "@/lib/keymap";
import type { Point } from "@/lib/types";

const RIGHT_BUTTON = 2;

/**
 * A right-button drag that pans from anywhere on the canvas, tables included: its handlers, and
 * whether one is under way. The native context menu is suppressed outside text fields because
 * macOS and Linux open it on press, which would swallow the drag before it starts.
 */
export function useRightDragPan() {
  const { getViewport, setViewport } = useReactFlow();
  const last = useRef<Point | null>(null);
  const [panning, setPanning] = useState(false);

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== RIGHT_BUTTON || isTyping(event.target)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      last.current = { x: event.clientX, y: event.clientY };
      setPanning(true);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!last.current) return;
      const { x, y, zoom } = getViewport();
      setViewport({
        x: x + event.clientX - last.current.x,
        y: y + event.clientY - last.current.y,
        zoom,
      });
      last.current = { x: event.clientX, y: event.clientY };
    },
    onLostPointerCapture: () => {
      last.current = null;
      setPanning(false);
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (!isTyping(event.target)) event.preventDefault();
    },
  };

  return { panning, handlers };
}
