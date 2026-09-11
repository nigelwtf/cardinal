import { createStore, del, get, keys, set } from "idb-keyval"
import { normalizeDiagram } from "@/lib/normalize"
import type { Diagram } from "@/lib/types"

const store = createStore("cardinal", "diagrams")
const LAST_OPENED = "cardinal:last-opened"

export interface DiagramSummary {
  id: string
  name: string
  tableCount: number
  updatedAt: number
}

export const saveDiagram = (diagram: Diagram) => set(diagram.id, diagram, store)
export const loadDiagram = async (id: string) => {
  const diagram = await get<Diagram>(id, store)
  return diagram ? normalizeDiagram(diagram) : undefined
}
export const deleteDiagram = (id: string) => del(id, store)

export async function listDiagrams(): Promise<DiagramSummary[]> {
  const ids = await keys(store)
  const diagrams = await Promise.all(ids.map((id) => get<Diagram>(id as string, store)))
  return diagrams
    .filter((d): d is Diagram => Boolean(d))
    .map((d) => ({ id: d.id, name: d.name, tableCount: d.tables.length, updatedAt: d.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export const rememberLastOpened = (id: string) => {
  try {
    localStorage.setItem(LAST_OPENED, id)
  } catch {
    /* private mode */
  }
}

export const getLastOpened = () => {
  try {
    return localStorage.getItem(LAST_OPENED)
  } catch {
    return null
  }
}
