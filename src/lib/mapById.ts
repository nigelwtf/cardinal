/** `items` with item `id` passed through `fn`, or `items` itself when `fn` hands the item back unchanged. */
export function mapById<T extends { id: string }>(items: T[], id: string, fn: (item: T) => T): T[] {
  const item = items.find((i) => i.id === id);
  if (!item) return items;
  const next = fn(item);
  return next === item ? items : items.map((i) => (i === item ? next : i));
}
