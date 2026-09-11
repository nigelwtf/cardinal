import { getNodesBounds, type Node } from "@xyflow/react"
import { toPng, toSvg } from "html-to-image"
import { download } from "@/lib/download"

const PADDING = 48

interface Options {
  nodes: Node[]
  filename: string
  dark: boolean
}

async function render(format: "png" | "svg", { nodes, filename, dark }: Options) {
  const viewport = document.querySelector<HTMLElement>(".react-flow__viewport")
  if (!viewport || nodes.length === 0) throw new Error("Nothing to export")

  const bounds = getNodesBounds(nodes)
  const width = Math.ceil(bounds.width + PADDING * 2)
  const height = Math.ceil(bounds.height + PADDING * 2)
  const offsetX = PADDING - bounds.x
  const offsetY = PADDING - bounds.y

  const config = {
    backgroundColor: dark ? "#0a0a0a" : "#ffffff",
    width,
    height,
    pixelRatio: format === "png" ? 2 : 1,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${offsetX}px, ${offsetY}px) scale(1)`,
    },
    filter: (node: HTMLElement) =>
      !node.classList?.contains?.("react-flow__minimap") && !node.classList?.contains?.("react-flow__controls"),
  }

  const dataUrl = format === "png" ? await toPng(viewport, config) : await toSvg(viewport, config)
  const blob = await (await fetch(dataUrl)).blob()
  download(filename, blob)
}

export const exportPng = (options: Options) => render("png", options)
export const exportSvg = (options: Options) => render("svg", options)
