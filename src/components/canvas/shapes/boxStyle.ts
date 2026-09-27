import type { CSSProperties } from "react";
import { tint } from "@/lib/color";

/** Border, wash and selection glow for a box. The wash stays faint so tables on top keep reading
 *  as the foreground in both themes. */
export const boxPaint = (color: string, selected: boolean): CSSProperties => ({
  borderColor: tint(color, selected ? 95 : 70),
  background: tint(color, 8),
  boxShadow: selected ? `0 0 0 4px ${tint(color, 18)}` : undefined,
});

/** Flow-space band above a box that holds its title: a 24px line plus a small gap. */
export const TITLE_CLEARANCE = 28;
