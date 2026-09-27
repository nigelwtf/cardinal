# Cardinal — engineering conventions

How this codebase likes to be written, not what it does (see `README.md` for the feature tour and
directory map). Read it before adding components, state, or a new import/export format.

## 1. Molecular components — the core principle

Build UI out of small, single-purpose, "dumb" **leaves**, then compose upward.

The falsifiable test for a leaf: **it does not import `useDiagram`, and it has no `useEffect` that
talks to anything outside itself.** Data in via props, intent out via callback props. That's what
makes it readable top-to-bottom and testable by rendering it with props and asserting on output —
no store to mock.

Current leaves to copy: `Flag` in `src/components/panels/Inspector.tsx` (takes
`active/label/hint/onClick/className`, renders a toggle chip, knows nothing about columns) and
`EnumTypeBadge` in `src/components/canvas/TableNode.tsx` (takes `column/expanded/onToggle`).
`EnumTypeBadge` is the *almost* case worth learning from: it accepts a whole `Column` but only ever
reads `column.type`, so it drags diagram vocabulary into a primitive for no gain. A new leaf in its
position should take `type: string`. Narrow leaf props to the data actually rendered.

One layer up, a **container** subscribes to the store, derives what the leaves need, and wires
callbacks back to store actions. `TableNodeInner` (same file) is the reference container: it pulls
`expandedEnumColumns` / `toggleEnumExpanded` off the store and hands `EnumTypeBadge` plain values.
Store access and business logic live in containers and in `src/lib/*` — never in leaves.

**Known refactor candidates** (don't fix opportunistically mid-unrelated-change; split them the
next time you're meaningfully editing one):

- `Inspector.tsx` — 442 lines, seven components in one file (`Flag`, `EnumValuesEditor`,
  `ColumnRow`, `TableInspector`, `RelationshipInspector`, `DiagramInspector`, `Inspector`).
- `TableNode.tsx` — `ColumnHandles`, `EnumTypeBadge`, `TableNodeInner` in one file.

When you split one, mirror `src/lib/mermaid/` and `src/lib/sql/`: a folder named after the feature,
one component per file, and the original filename (`Inspector.tsx`) kept as the thin composer so
imports don't churn.

Before hand-rolling a styled `<button>`/`<input>`/chip, check `src/components/ui/*` (shadcn
primitives) and compose those. If a primitive is close but not right, wrap it — don't fork its
internals, because we still want `pnpm dlx shadcn@latest add` to be a safe way to pull updates.

## 2. State: store vs. local, and the `apply()` lane

Rule zero: **new interaction state starts as component `useState`.** That is the existing practice —
dialog open flags live in `App.tsx`, the Explorer's per-table expand map lives in `Explorer.tsx`. It
is promoted into the Zustand store only when something distant has to drive it. `expandedEnumColumns`
earns its place precisely because `CommandPalette` calls `setAllEnumsExpanded` while `TableNode`
renders it; don't cite it as licence to put every flag in the store.

Inside `src/store/useDiagram.ts` (the single store), three groups:

- **Diagram data** (`tables`, `relationships`, `name` — anything that round-trips through
  Mermaid/SQL/JSON) goes through `apply(fn, options)`. `apply` is what stamps `updatedAt`, pushes
  undo history, and flips `dirty` so `App.tsx`'s debounced IndexedDB save fires. Every editing
  action (`addTable`, `updateColumn`, `setWaypoints`, `layout`, …) is a one-liner delegating to it.
  Pass `{ commit: false }` for mid-gesture updates (drag) so a drag doesn't produce 60 undo entries;
  the gesture's start snapshot is pushed once via `commitSnapshot`.
- **History and document lifecycle** (`undo`, `redo`, `commitSnapshot`, `replaceDiagram`,
  `markSaved`) legitimately `set()` `diagram`/`past`/`future` directly — they *are* the history
  mechanism, so they can't route through it. This is the only sanctioned exception; if you're
  writing anything else that sets `diagram` outside `apply`, you're writing a bug.
- **Ephemeral store state** (`selection`, `parseErrors`, `expandedEnumColumns`) is plain `set()`,
  never enters undo, and is never persisted — `persistence.ts` serializes the `Diagram` object only,
  not the store. Note some actions do both (`addTable` applies, then `set({ selection })`); that
  pairing is fine and intentional.

Two details that bite:

- `apply` bails on `next === diagram` identity. A reducer that wants to be a no-op must
  `return d` itself — returning a fresh spread of unchanged data still pushes an undo entry
  (`reorderColumn`'s out-of-range guard returns the unchanged *table*, so the diagram is still
  re-spread; fix that shape if you touch it).
- Mutations use the named helpers `mapTable` and `touch` rather than inlining
  `{ ...diagram, tables: diagram.tables.map(...) }`. Add a helper when you'd be writing the third
  copy of a spread, not the second.

Components subscribe with one narrow selector per field (`useDiagram((s) => s.selection)`), never by
destructuring the store object — that's what keeps React Flow nodes from re-rendering on every
unrelated keystroke. Follow it.

## 3. Logic lives in `src/lib/*`, not in components

- Pure functions, no React, no store: `formatEnumType`, `parseEnumValues`, `toMermaid`, `toSql`,
  `autoLayout`, `dispatchKeymap`. Same input, same output — cheap to reason about and (see §6)
  cheap to test.
- **One grammar, one module.** `src/lib/enum.ts` is the reference: the `enum<A, B>` grammar is
  parsed/formatted in exactly one place and consumed by `Inspector`, `TableNode`, both SQL
  directions, and both Mermaid directions. Writing a second regex for a concept that already has a
  lib module is the most likely way to introduce drift here — import the module.
- **Declarative tables over branching.** `TYPE_MAP: Record<Dialect, Record<string, string>>` in
  `sql/export.ts`, `LEFT_TOKENS`/`RIGHT_TOKENS` plus their derived `*_LOOKUP` inverses in
  `mermaid/tokens.ts`, and the `KeyBinding[]` keymap in `lib/keymap.ts` + `App.tsx` all replace
  if-chains with data. Prefer a lookup table or a per-variant function map whenever the variant
  count can grow.
- **Round-trips are symmetric.** Mermaid and SQL each have an export and an import module. Adding
  an export spelling without the matching parse (or vice versa) is half a feature; do both in the
  same change. `enum.ts` shows the tax this avoids: it accepts both the `enum<…>` display form and
  the `enum(…)` mermaid/SQL form, and normalizes to one canonical spelling on the way in.

Being liberal in what a *parser* accepts is not a back-compat shim (§7) — it's the format's surface
area. Keep the tolerance in the parse module and normalize immediately, so the rest of the app only
ever sees the canonical form.

## 4. TypeScript & data modeling

- `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
  `erasableSyntaxOnly` are all on in `tsconfig.json`. Keep them on; fix the error rather than
  silence it. `erasableSyntaxOnly` means no enums and no parameter properties — use union types
  and plain assignment.
- `verbatimModuleSyntax` is on: type-only imports **must** be written `import type { Column }` (or
  `import { type Cardinality }` inline, as `types.ts` consumers do). A plain value import of a type
  fails the build.
- Model states as discriminated unions rather than a bag of optional booleans. `Selection`
  (`{ kind: "table" | "relationship" | "none" }`) and `Cardinality` are the reference examples: a
  switch on `.kind` is exhaustive; `isTableSelected`/`isRelSelected` pairs are not.
- Props types are inline and colocated (`{ tableId: string; column: Column }`). Extract a named
  exported interface only when the type is genuinely reused (`TableNodeData`, `KeyBinding`).
- Use the `@/*` alias, not `../../..` chains.

## 5. Styling

- Tailwind v4 utilities composed via `cn()` — re-exported from the `cn` package in
  `src/lib/utils.ts` (not the usual shadcn `clsx` + `tailwind-merge` pairing; import from
  `@/lib/utils` either way). Never string-concatenate class names.
- Geometry constants and helpers with meaning beyond one component (`HEADER_HEIGHT`, `ROW_HEIGHT`,
  `FOOTER_HEIGHT`, `tableWidth()`, `tableHeight()`, `tableCenter()` in `src/lib/layout.ts`) are
  imported, not re-typed as magic numbers — dagre layout, the canvas node, and the Explorer's
  "focus this table" math all have to agree or nodes visibly drift.
- Theming is `next-themes` with `attribute="class"` against the `:root` / `.dark` custom-property
  blocks in `index.css`. Style with the semantic variables (`bg-card`, `text-muted-foreground`,
  `border-border`); a raw hex that only reads in one theme is a bug. The per-table `accent` colors
  in `ACCENTS` are the deliberate exception and are always blended (`color-mix`) rather than used
  as a flat background.

## 6. Testability (no runner yet)

`package.json` has no `vitest`/`jest`. That's a gap, not a feature — and the §1/§3 conventions exist
so closing it is `pnpm add -D vitest` plus assertions, not a rearchitecture. The highest-value first
tests, when someone adds the runner, are the pure round-trips: `enum.ts`, `mermaid/parse` ↔
`mermaid/serialize`, `sql/import` ↔ `sql/export`. Keep store access out of leaves and side effects
out of `lib` and that stays true.

## 7. Longevity over cleverness

- No feature flags, no back-compat shims, no `// keeping this for now`. `normalize.ts` is the one
  sanctioned exception, and only because documents already sitting in users' IndexedDB have to keep
  opening (it forward-migrates the pre-waypoints `offset` field). Migrate there, on read, once —
  don't let a legacy shape leak into the live types.
- Generalize on the second real duplicate, not the first guess. `enum.ts` and the `TYPE_MAP` /
  token tables are what earned it. Don't pre-build an abstraction for a fourth dialect that
  doesn't exist.
- Prefer the boring explicit version over the clever one-liner. This is a single-maintainer,
  indefinitely-lived local-first tool; whoever reads a bug report against it in two years (you, or
  an agent) has none of today's context. Where a decision isn't obvious from the code, leave the
  short *why* comment — `layout.ts` dropping waypoints on re-layout, and `enum.ts` explaining why
  the grammar has no escaping, are the house style.

## Commands

```bash
pnpm dev         # vite dev server
pnpm build       # tsc --noEmit && vite build
pnpm typecheck   # tsc --noEmit
pnpm lint        # oxlint
pnpm preview     # serve the production build
```

Run `typecheck` and `lint` before calling any change done. `typecheck` is clean and must stay
clean. `.oxlintrc.json` enables exactly two rules: `react/rules-of-hooks` (error — zero, keep it
there) and `react/only-export-components` (warn). That second rule currently has four known
warnings, all from files that export a helper alongside a component (`CrowFootMarkers.tsx`, and
the `cva` variants in `ui/badge`, `ui/button`, `ui/tabs`). Don't add a fifth: put shared helpers in
a sibling module (`canvas/edgePath.ts` and `canvas/handles.ts` are the pattern) instead of
exporting them from a component file. Retiring the existing four is a welcome side effect of the
§1 file splits.
