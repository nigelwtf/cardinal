import type { Cardinality } from "@/lib/types"

const CARDINALITIES: Cardinality[] = ["one", "zero-or-one", "one-or-more", "zero-or-more"]

export const markerUrl = (cardinality: Cardinality, end: "start" | "end") =>
  `url(#cf-${cardinality}-${end})`

const Bar = ({ x }: { x: number }) => <line x1={x} y1={5} x2={x} y2={19} />
const Circle = ({ x }: { x: number }) => (
  <circle cx={x} cy={12} r={3.4} fill="var(--background)" />
)
const Foot = () => (
  <>
    <line x1={10} y1={12} x2={22} y2={5} />
    <line x1={10} y1={12} x2={22} y2={19} />
    <line x1={10} y1={12} x2={22} y2={12} />
  </>
)

const Glyph = ({ cardinality }: { cardinality: Cardinality }) => {
  switch (cardinality) {
    case "one":
      return <Bar x={16} />
    case "zero-or-one":
      return (
        <>
          <Circle x={7} />
          <Bar x={16} />
        </>
      )
    case "one-or-more":
      return (
        <>
          <Bar x={7} />
          <Foot />
        </>
      )
    case "zero-or-more":
      return (
        <>
          <Circle x={5} />
          <Foot />
        </>
      )
  }
}

/**
 * Crow's-foot notation rendered as SVG markers. `auto-start-reverse` mirrors the
 * glyph for the source end so both feet open towards their own table.
 */
export function CrowFootMarkers() {
  return (
    <svg className="pointer-events-none absolute size-0" aria-hidden>
      <defs>
        {CARDINALITIES.flatMap((cardinality) =>
          (["end", "start"] as const).map((end) => (
            <marker
              key={`${cardinality}-${end}`}
              id={`cf-${cardinality}-${end}`}
              viewBox="0 0 24 24"
              markerUnits="userSpaceOnUse"
              markerWidth={24}
              markerHeight={24}
              refX={22}
              refY={12}
              orient={end === "start" ? "auto-start-reverse" : "auto"}
            >
              <g fill="none" stroke="context-stroke" strokeWidth={1.5} strokeLinecap="round">
                <Glyph cardinality={cardinality} />
              </g>
            </marker>
          )),
        )}
      </defs>
    </svg>
  )
}
