import { useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { tableCenter } from "@/lib/layout";
import { useDiagram } from "@/store/useDiagram";
import { TableColumns } from "./explorer/TableColumns";
import { TableRow } from "./explorer/TableRow";

export function Explorer() {
  const tables = useDiagram((s) => s.diagram.tables);
  const relationships = useDiagram((s) => s.diagram.relationships);
  const selection = useDiagram((s) => s.selection);
  const select = useDiagram((s) => s.select);
  const addTable = useDiagram((s) => s.addTable);
  const { setCenter } = useReactFlow();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.columns.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [query, tables]);

  const focus = (id: string) => {
    const table = tables.find((t) => t.id === id);
    select({ kind: "table", id });
    if (table) {
      const { x, y } = tableCenter(table);
      setCenter(x, y, { zoom: 1, duration: 350 });
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tables
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{tables.length}</span>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto size-6"
          onClick={() => addTable()}
          title="New table"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables & columns"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-1.5">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {tables.length ? "No matches" : "No tables yet"}
            </p>
          )}
          {filtered.map((table) => {
            const degree = relationships.filter(
              (r) => r.sourceTableId === table.id || r.targetTableId === table.id,
            ).length;
            return (
              <div key={table.id}>
                <TableRow
                  name={table.name}
                  accent={table.accent}
                  degree={degree}
                  selected={selection.kind === "table" && selection.id === table.id}
                  open={Boolean(expanded[table.id])}
                  onFocus={() => focus(table.id)}
                  onToggle={() => setExpanded((prev) => ({ ...prev, [table.id]: !prev[table.id] }))}
                />
                {expanded[table.id] && <TableColumns columns={table.columns} />}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
