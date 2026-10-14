import { useMemo, useState } from "react";
import { reuseUnchanged } from "./reuseUnchanged";

/** Remembers the last list it handed out, so the next can reuse its items. */
function createReuser<T extends { id: string }>() {
  let previous: T[] = [];
  return (next: T[]) => (previous = reuseUnchanged(previous, next));
}

/** `items`, keeping each one React Flow was already handed when it hasn't changed. */
export function useReusedItems<T extends { id: string }>(items: T[]): T[] {
  const [reuse] = useState(createReuser<T>);
  return useMemo(() => reuse(items), [reuse, items]);
}
