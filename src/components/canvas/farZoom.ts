import type { ReactFlowState } from "@xyflow/react";

/**
 * Below this zoom a row's text is a few pixels high, so rows draw as bars and edge labels go.
 * Thousands of unreadable text runs were the bulk of what a large diagram paints on every pan.
 */
export const FAR_ZOOM = 0.35;

export const isFarZoom = (state: ReactFlowState) => state.transform[2] < FAR_ZOOM;
