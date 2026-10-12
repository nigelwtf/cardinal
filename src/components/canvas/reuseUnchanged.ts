const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Equal as data: the same primitives, arrays and plain objects all the way down. */
function alike(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, index) => alike(item, b[index]));
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => alike(a[key], b[key]));
}

/**
 * `next`, with each item that equals its namesake in `previous` swapped for that earlier object,
 * and `previous` itself when nothing changed. The canvas rebuilds every node and edge on each
 * edit, and React Flow only skips one it was handed before.
 */
export function reuseUnchanged<T extends { id: string }>(previous: T[], next: T[]): T[] {
  const byId = new Map(previous.map((item) => [item.id, item]));
  let changed = previous.length !== next.length;
  const items = next.map((item, index) => {
    const earlier = byId.get(item.id);
    const kept = earlier && alike(earlier, item) ? earlier : item;
    changed ||= kept !== previous[index];
    return kept;
  });
  return changed ? items : previous;
}
