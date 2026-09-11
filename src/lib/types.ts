export type Cardinality = "one" | "zero-or-one" | "one-or-more" | "zero-or-more"

export interface Point {
  x: number
  y: number
}

export interface Column {
  id: string
  name: string
  type: string
  pk: boolean
  fk: boolean
  uk: boolean
  nullable: boolean
  defaultValue?: string
  comment?: string
}

export interface Table {
  id: string
  name: string
  comment?: string
  accent: string
  position: { x: number; y: number }
  columns: Column[]
}

export interface Relationship {
  id: string
  sourceTableId: string
  targetTableId: string
  sourceColumnId?: string
  targetColumnId?: string
  /** cardinality at the source (left) end */
  sourceCardinality: Cardinality
  /** cardinality at the target (right) end */
  targetCardinality: Cardinality
  /** mermaid `--` (identifying) vs `..` (non-identifying) */
  identifying: boolean
  label: string
  /**
   * Manual bends, in order from source to target. Each is stored as a displacement
   * from the path's natural midpoint so the shape travels with the tables instead of
   * being stranded when they move.
   */
  waypoints?: Point[]
}

export interface Diagram {
  id: string
  name: string
  tables: Table[]
  relationships: Relationship[]
  createdAt: number
  updatedAt: number
}

export const ACCENTS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
] as const

export const COMMON_TYPES = [
  "uuid",
  "int",
  "bigint",
  "smallint",
  "serial",
  "decimal",
  "float",
  "boolean",
  "string",
  "text",
  "varchar",
  "char",
  "json",
  "jsonb",
  "date",
  "time",
  "timestamp",
  "timestamptz",
  "enum",
  "bytea",
]
