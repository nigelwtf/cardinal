import { useDiagram } from "@/store/useDiagram";
import { DrawLayer } from "./DrawLayer";
import { ToolRail } from "./ToolRail";
import { TOOLS } from "./tools";

/** The tool rail, plus the drawing surface whenever a shape tool is picked. */
export function CanvasTools() {
  const tool = useDiagram((s) => s.tool);
  const setTool = useDiagram((s) => s.setTool);

  return (
    <>
      {tool !== "select" && <DrawLayer kind={tool} />}
      <div className="absolute left-4 top-4 z-[6]">
        <ToolRail tools={TOOLS} active={tool} onChange={setTool} />
      </div>
    </>
  );
}
