/** `item` with `patch` applied, or `item` itself when no value changes, so `apply` sees a no-op. */
export function patched<T extends object>(item: T, patch: Partial<NoInfer<T>>): T {
  // Object.keys widens to string[]; every key here came from `patch`, so it is a key of T.
  const keys = Object.keys(patch) as (keyof T)[];
  return keys.every((key) => Object.is(item[key], patch[key])) ? item : { ...item, ...patch };
}
