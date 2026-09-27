import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Tool } from "@/store/shapeSlice";
import type { ToolDefinition } from "./tools";

/** A vertical strip of canvas tools with the active one highlighted. */
export function ToolRail({
  tools,
  active,
  onChange,
}: {
  tools: readonly ToolDefinition[];
  active: Tool;
  onChange: (tool: Tool) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Canvas tools"
      className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-1 shadow-sm"
    >
      {tools.map(({ id, label, key, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={label}
              aria-pressed={active === id}
              onClick={() => onChange(id)}
              className={cn(
                active === id &&
                  "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20",
              )}
            >
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {label} <Kbd>{key.toUpperCase()}</Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
