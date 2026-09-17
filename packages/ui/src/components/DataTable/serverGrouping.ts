import type { DataTableServerGroup, DataTableServerGroupRows } from "../../types/table";

/**
 * Identity token for a group whose `key` is `null` (the grouped column itself
 * was null for those records).
 *
 * `rowsByGroup` is a `Record<string, …>` and `onExpandedChange` hands back
 * `string[]`, so the null group needs a stable non-null identity. The token is
 * opaque to the table — it never inspects it — but it is deliberately the same
 * `__none__` sentinel that query strings use, so the caller can forward an
 * expanded key straight to its data layer without a second mapping table.
 */
export const DATA_TABLE_NULL_GROUP_KEY = "__none__";

/** Stable string identity for a group key, including the null group. */
export function dataTableGroupKeyId(key: string | null): string {
  return key ?? DATA_TABLE_NULL_GROUP_KEY;
}

/** Inverse of {@link dataTableGroupKeyId} — `__none__` maps back to `null`. */
export function dataTableGroupKeyFromId(identity: string): string | null {
  return identity === DATA_TABLE_NULL_GROUP_KEY ? null : identity;
}

/**
 * One rendered group: the server group plus where its loaded rows sit in the
 * flattened row model the table is fed. Computed by `DataTable` and consumed by
 * `DataTableBody`, so both always agree on the slice boundaries.
 */
export interface DataTableServerGroupSection<TData> {
  group: DataTableServerGroup;
  /** `dataTableGroupKeyId(group.key)`. */
  identity: string;
  expanded: boolean;
  entry?: DataTableServerGroupRows<TData>;
  /** Index of this group's first row in the flattened row model. */
  rowStart: number;
  /** Number of loaded rows for this group (0 while collapsed). */
  rowCount: number;
}
