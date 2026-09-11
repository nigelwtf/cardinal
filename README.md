<img src="./src/assets/cardinal.png" alt="An iconographic portrait of a red Cardinal bird" width="96" height="96" />

# Cardinal

A fully open-source, Mermaid-based, ERD editor that doesn't feel like a 2008 enterprise architecture suite, isn't bolted onto a
whiteboard product, and doesn't cost a seat licence. Local-first, keyboard-driven, with Mermaid interop.

![stack](https://img.shields.io/badge/React%20Flow-canvas-6366f1) ![stack](https://img.shields.io/badge/Mermaid-source%20of%20truth-ec4899)

## What it does

- **React Flow canvas** — drag tables, drag from any column to any column to draw a relationship,
  crow's-foot notation rendered as real SVG markers (identifying vs non-identifying, four
  cardinalities per end).
- **Connectors you can push around** — hover any relationship and its handles appear: a hollow dot on
  every segment that creates a bend when dragged, and a solid dot on every existing bend. Add as many
  as you like. Bends snap to an 8px grid and line up with their neighbours automatically (hold `⌥` to
  go off-grid); double-click a dot to remove it, or *Straighten line* to clear them all. Routes stay
  orthogonal with rounded corners no matter how many bends you add. Drag either *end* of a line onto a
  different column to re-point the relationship.

  Bends are stored as displacements from the path's natural midpoint, so they travel with the tables
  rather than being stranded when they move; a re-layout clears them.
- **Mermaid as a first-class surface** — the `erDiagram` panel is editable. Type in it and the canvas
  updates; move things on the canvas and the source updates. Reconciliation keeps table ids, canvas
  positions, colours and the bits Mermaid can't express (nullability, defaults) intact.
- **Import** Mermaid, SQL DDL (`CREATE TABLE`, inline + `ALTER TABLE` foreign keys), or a Cardinal JSON document.
- **Export** Mermaid, PostgreSQL / MySQL / SQLite DDL, PNG, SVG, JSON.
- **Auto layout** via dagre, left-to-right or top-to-bottom.
- **Command palette** (`⌘K`) for jumping to tables and running actions.
- **Local-first storage** — every diagram lives in IndexedDB. No account, no server, no network calls.

## Caveats
I built this for myself, to solve the real need I have to produce ER diagrams at work. You're free to use this, but note that this tool is completely unsupported.

## Run it

```bash
pnpm install
pnpm dev
```

## Shortcuts

| Key | Action |
| --- | --- |
| `⌘K` | Command palette |
| `N` | New table |
| `L` | Auto layout |
| `⌘Z` / `⇧⌘Z` | Undo / redo |
| `Double-click canvas` | New table at the cursor |
| `Backspace` | Delete selection |
| `Drag a dot on a line` | Add or move a bend |
| `Double-click a dot` | Remove that bend |
| `⌥` while dragging | Bend off-grid |
| `Drag a line end` | Re-point the relationship |

## How it's put together

```
src/
  lib/
    types.ts          core model: Table, Column, Relationship, Diagram
    mermaid/          tokens, serializer, parser + reconciler
    sql/              DDL export (3 dialects) and DDL import
    layout.ts         dagre auto layout + node sizing
    normalize.ts      forward-migration for documents saved by older builds
    persistence.ts    IndexedDB document store
  store/useDiagram.ts zustand store with snapshot undo/redo
  components/
    canvas/           React Flow node, edge, orthogonal router, crow's-foot markers
    panels/           explorer, inspector, code panel
```

GLHF
