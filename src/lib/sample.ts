import { newId } from "@/lib/id"
import { autoLayout } from "@/lib/layout"
import type { Cardinality, Column, Diagram, Table } from "@/lib/types"
import { ACCENTS } from "@/lib/types"

type Spec = [name: string, type: string, flags?: string]

const column = ([name, type, flags = ""]: Spec): Column => ({
  id: newId("col"),
  name,
  type,
  pk: flags.includes("PK"),
  fk: flags.includes("FK"),
  uk: flags.includes("UK"),
  nullable: flags.includes("NULL") && !flags.includes("PK"),
})

const table = (index: number, name: string, specs: Spec[]): Table => ({
  id: newId("tbl"),
  name,
  accent: ACCENTS[index % ACCENTS.length],
  position: { x: 0, y: 0 },
  columns: specs.map(column),
})

export function sampleDiagram(): Diagram {
  const crew = table(0, "CREW_MEMBER", [
    ["id", "uuid", "PK"],
    ["name", "string"],
    ["species", "string", "NULL"],
    ["role", "string"],
    ["hired_at", "timestamptz"],
  ])
  const ship = table(1, "SHIP", [
    ["id", "uuid", "PK"],
    ["registration", "string", "UK"],
    ["class", "string"],
    ["captain_id", "uuid", "FK NULL"],
  ])
  const delivery = table(2, "DELIVERY", [
    ["id", "uuid", "PK"],
    ["ship_id", "uuid", "FK"],
    ["planet_id", "uuid", "FK"],
    ["status", "string"],
    ["departed_at", "timestamptz", "NULL"],
  ])
  const planet = table(3, "PLANET", [
    ["id", "uuid", "PK"],
    ["name", "string", "UK"],
    ["quadrant", "string"],
    ["hostility", "int"],
  ])
  const parcel = table(4, "PARCEL", [
    ["id", "uuid", "PK"],
    ["delivery_id", "uuid", "FK"],
    ["contents", "text"],
    ["is_sentient", "boolean"],
    ["mass_kg", "decimal"],
  ])
  const invoice = table(5, "INVOICE", [
    ["id", "uuid", "PK"],
    ["delivery_id", "uuid", "FK UK"],
    ["amount_cents", "bigint"],
    ["settled_at", "timestamptz", "NULL"],
  ])

  const tables = [crew, ship, delivery, planet, parcel, invoice]

  const link = (
    source: Table,
    target: Table,
    label: string,
    sourceCardinality: Cardinality,
    targetCardinality: Cardinality,
    sourceColumn?: string,
    targetColumn?: string,
  ) => ({
    id: newId("rel"),
    sourceTableId: source.id,
    targetTableId: target.id,
    sourceColumnId: source.columns.find((c) => c.name === (sourceColumn ?? "id"))?.id,
    targetColumnId: target.columns.find((c) => c.name === targetColumn)?.id,
    sourceCardinality,
    targetCardinality,
    identifying: true,
    label,
  })

  return {
    id: newId("dgm"),
    name: "Planet Express",
    tables,
    relationships: [
      link(crew, ship, "captains", "zero-or-one", "zero-or-more", "id", "captain_id"),
      link(ship, delivery, "flies", "one", "zero-or-more", "id", "ship_id"),
      link(planet, delivery, "destination of", "one", "zero-or-more", "id", "planet_id"),
      link(delivery, parcel, "carries", "one", "one-or-more", "id", "delivery_id"),
      link(delivery, invoice, "billed by", "one", "zero-or-one", "id", "delivery_id"),
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const seededDiagram = () => autoLayout(sampleDiagram())

export const emptyDiagram = (name = "Untitled schema"): Diagram => ({
  id: newId("dgm"),
  name,
  tables: [],
  relationships: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})
