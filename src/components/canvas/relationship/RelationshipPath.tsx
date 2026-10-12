import type { Cardinality } from "@/lib/types";
import { markerUrl } from "../CrowFootMarkers";

type RelationshipPathProps = {
  path: string;
  selected: boolean;
  identifying?: boolean;
  dimmed?: boolean;
  cardinalities?: { source: Cardinality; target: Cardinality };
  onEnter: () => void;
  onLeave: () => void;
};

/** A relationship's line with its crow's-foot ends. */
export function RelationshipPath({
  path,
  selected,
  identifying,
  dimmed,
  cardinalities,
  onEnter,
  onLeave,
}: RelationshipPathProps) {
  return (
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ opacity: dimmed ? 0.2 : 1 }}>
      {/* Generous invisible hit area — the visible stroke is far too thin to grab. */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={24} strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        className="react-flow__edge-path"
        markerStart={cardinalities ? markerUrl(cardinalities.source, "start") : undefined}
        markerEnd={cardinalities ? markerUrl(cardinalities.target, "end") : undefined}
        style={{
          stroke: selected ? "var(--primary)" : "var(--muted-foreground)",
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: identifying === false ? "6 4" : undefined,
        }}
      />
    </g>
  );
}
