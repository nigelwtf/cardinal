import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { download } from "@/lib/download";
import { toMermaid } from "@/lib/mermaid/serialize";
import { useDiagram } from "@/store/useDiagram";
import { CopyButton } from "./CopyButton";

/** The diagram as Mermaid text. Typing applies after a pause, and again on blur. */
export function MermaidEditor() {
  const diagram = useDiagram((s) => s.diagram);
  const applyMermaid = useDiagram((s) => s.applyMermaid);
  const parseErrors = useDiagram((s) => s.parseErrors);
  const generated = useMemo(() => toMermaid(diagram), [diagram]);
  const [draft, setDraft] = useState(generated);
  const editing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!editing.current) setDraft(generated);
  }, [generated]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const applyNow = (value: string) => {
    clearTimeout(timer.current);
    timer.current = undefined;
    applyMermaid(value);
  };

  const onChange = (value: string) => {
    setDraft(value);
    editing.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => applyNow(value), 500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
        <span className="text-[11px] text-muted-foreground">Edit here to change the diagram</span>
        <div className="ml-auto flex items-center">
          <CopyButton getValue={() => draft} />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => download(`${diagram.name}.mmd`, draft, "text/plain")}
          >
            <Download className="size-3" /> .mmd
          </Button>
        </div>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          // Typing still waiting out its pause applies now. Text that already applied is left
          // alone, since applying it again would only add an empty undo step.
          if (timer.current !== undefined) applyNow(draft);
          editing.current = false;
        }}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-[11px] leading-relaxed focus-visible:ring-0"
      />
      {parseErrors.length > 0 && (
        <div className="max-h-24 shrink-0 overflow-auto border-t bg-destructive/10 p-2 text-[11px] text-destructive">
          {parseErrors.map((error) => (
            <div key={`${error.line}-${error.message}`} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              <span>
                Line {error.line}: {error.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
