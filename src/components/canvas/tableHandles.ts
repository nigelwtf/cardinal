/** Handle id for a connection anchored to the table header rather than a column. */
export const TABLE_HANDLE = "__table";

export const handleId = (columnId: string, role: "source" | "target", side: "left" | "right") =>
  `${columnId}|${role}|${side}`;

export const columnFromHandle = (handle?: string | null) => {
  if (!handle) return undefined;
  const [columnId] = handle.split("|");
  return columnId === TABLE_HANDLE ? undefined : columnId;
};
