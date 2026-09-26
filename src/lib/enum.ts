/** Canonical display form: `enum<Apple, Peach, Plum>`. */
const ANGLE_RE = /^enum\s*<([\s\S]*)>$/i;
/** Mermaid attribute types can't contain spaces or angle brackets, so this form
 *  round-trips through mermaid source, and it also matches SQL's `enum(...)`. */
const PAREN_RE = /^enum\s*\(([\s\S]*)\)$/i;

/** Strips one matching pair of outer quotes (`'Apple'` / `"Apple"` -> `Apple`), leaving
 *  quote characters that aren't wrapping the whole value (e.g. `O'Brien`) untouched. */
function unwrapQuotes(value: string): string {
  const first = value[0];
  const last = value[value.length - 1];
  if (value.length >= 2 && (first === "'" || first === '"') && first === last) {
    return value.slice(1, -1);
  }
  return value;
}

/** This grammar has no escaping, so a value can't itself contain a comma — split is a plain,
 *  quote-unaware comma split, then each field is unwrapped if it's a whole SQL string literal. */
function splitEnumBody(body: string): string[] {
  return body
    .split(",")
    .map((part) => unwrapQuotes(part.trim()))
    .filter(Boolean);
}

export function isEnumType(type: string): boolean {
  const trimmed = type.trim();
  return ANGLE_RE.test(trimmed) || PAREN_RE.test(trimmed);
}

export function parseEnumValues(type: string): string[] {
  const trimmed = type.trim();
  const match = ANGLE_RE.exec(trimmed) ?? PAREN_RE.exec(trimmed);
  if (!match) return [];
  return splitEnumBody(match[1]);
}

export function formatEnumType(values: string[]): string {
  return `enum<${values.join(", ")}>`;
}

/** Reformats any recognized enum spelling (mermaid/SQL) into the canonical `enum<...>` form. */
export function normalizeEnumType(type: string): string {
  return isEnumType(type) ? formatEnumType(parseEnumValues(type)) : type;
}

/** `null` when `type` isn't an enum; otherwise the mermaid-safe `enum(A,B,C)` spelling.
 *  Mermaid attribute types can't contain whitespace, so (like every other type spelling
 *  in this app) spaces are collapsed to underscores — lossy, but round-trips without
 *  dropping the column, which a raw space would otherwise do. */
export function toMermaidEnumType(type: string): string | null {
  if (!isEnumType(type)) return null;
  const values = parseEnumValues(type).map((value) => value.replace(/\s+/g, "_"));
  return `enum(${values.join(",")})`;
}
