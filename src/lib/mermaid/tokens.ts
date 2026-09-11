import type { Cardinality } from "@/lib/types"

/** Mermaid cardinality tokens as written on the LEFT of the relationship line. */
export const LEFT_TOKENS: Record<Cardinality, string> = {
  one: "||",
  "zero-or-one": "|o",
  "one-or-more": "}|",
  "zero-or-more": "}o",
}

/** Mermaid cardinality tokens as written on the RIGHT of the relationship line. */
export const RIGHT_TOKENS: Record<Cardinality, string> = {
  one: "||",
  "zero-or-one": "o|",
  "one-or-more": "|{",
  "zero-or-more": "o{",
}

export const LEFT_LOOKUP: Record<string, Cardinality> = Object.fromEntries(
  Object.entries(LEFT_TOKENS).map(([k, v]) => [v, k as Cardinality]),
)

export const RIGHT_LOOKUP: Record<string, Cardinality> = Object.fromEntries(
  Object.entries(RIGHT_TOKENS).map(([k, v]) => [v, k as Cardinality]),
)

export const CARDINALITY_LABEL: Record<Cardinality, string> = {
  one: "Exactly one",
  "zero-or-one": "Zero or one",
  "one-or-more": "One or more",
  "zero-or-more": "Zero or more",
}
