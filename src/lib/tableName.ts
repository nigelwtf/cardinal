/**
 * `name`, then `name_copy`, `name_copy2`, … etc until it is not in `taken`.
 */
export function uniqueTableName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name)) return name;
  let candidate = `${name}_copy`;
  let suffix = 2;
  while (taken.has(candidate)) candidate = `${name}_copy${suffix++}`;
  return candidate;
}
