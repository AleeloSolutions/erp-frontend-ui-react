import type {
  DataTableServerGroup,
  DataTableServerGroupNode,
  DataTableServerGroupRows,
} from "../../types/table";

/**
 * Identity token for a group whose `key` is `null` (the grouped column itself
 * was null for those records).
 *
 * `nodesByPath` / `rowsByGroup` are `Record<string, …>` and `onExpandedChange`
 * hands back `string[]`, so the null group needs a stable non-null identity.
 * The token is opaque to the table — it never inspects it — but it is
 * deliberately the same `__none__` sentinel that query strings use, so the
 * caller can forward an expanded key straight to its data layer without a
 * second mapping table.
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
 * Separator joining a group path into one record key.
 *
 * ASCII UNIT SEPARATOR, not `/` or `>`: group keys are server ids and labels
 * that routinely contain both, and a separator that can appear inside a key
 * makes two different paths collide on one cache entry — a group quietly
 * showing another group rows. Nothing but the two functions below should
 * parse it; hand your data layer the `path` array, not the joined id.
 */
export const DATA_TABLE_GROUP_PATH_SEPARATOR = "";

/**
 * Record key for the node at `path` (group identities, outermost first).
 *
 * A one-element path joins to the identity itself, so single-level
 * `rowsByGroup` keys and nested `nodesByPath` keys agree at the top level.
 */
export function dataTableGroupPathId(path: readonly string[]): string {
  return path.join(DATA_TABLE_GROUP_PATH_SEPARATOR);
}

/** Inverse of {@link dataTableGroupPathId}. `""` is the root path. */
export function dataTableGroupPathFromId(pathId: string): string[] {
  return pathId === "" ? [] : pathId.split(DATA_TABLE_GROUP_PATH_SEPARATOR);
}

/** True when `pathId` is `ancestorId` itself or sits underneath it. */
export function dataTableGroupPathStartsWith(
  pathId: string,
  ancestorId: string
): boolean {
  if (ancestorId === "") return true;
  return (
    pathId === ancestorId ||
    pathId.startsWith(ancestorId + DATA_TABLE_GROUP_PATH_SEPARATOR)
  );
}

/**
 * Indent, in px, for a group header at `depth`.
 *
 * A flat step per level is what makes deep chains unusable: Odoo-style
 * grouping runs to seven levels (Salesperson, Customer, Year, Quarter, Month,
 * …) and 7 × 16px eats a third of the first column before the label starts. So
 * the step decays — generous while the eye is still counting levels, tight
 * once the per-level badge is doing the work — and the ramp is capped.
 *
 * Shared by both grouping modes on purpose: one ramp is what stops
 * client-side and server-side groups looking like two different products.
 */
const GROUP_INDENT_STEPS = [16, 16, 14, 12, 10];
const GROUP_INDENT_TAIL_STEP = 8;
const GROUP_INDENT_MAX = 96;

export function dataTableGroupIndent(depth: number): number {
  let total = 0;
  for (let level = 0; level < depth; level += 1) {
    total += GROUP_INDENT_STEPS[level] ?? GROUP_INDENT_TAIL_STEP;
  }
  return Math.min(total, GROUP_INDENT_MAX);
}

/**
 * Inset for the status / load-more lines that belong *inside* a group at
 * `depth`. The 44px base lines them up past the disclosure triangle, exactly
 * where a single-level group put them before nesting existed.
 */
export function dataTableGroupStateInset(depth: number): number {
  return 44 + dataTableGroupIndent(depth);
}

/**
 * One rendered group: the server group, where it sits in the tree, and where
 * its loaded rows sit in the flattened row model the table is fed. Computed by
 * `DataTable` and consumed by `DataTableBody`, so both always agree on the
 * slice boundaries.
 */
export interface DataTableServerGroupSection<TData> {
  group: DataTableServerGroup;
  /** `dataTableGroupKeyId(group.key)` — this group own key segment. */
  identity: string;
  /** Group identities from the top level down, `identity` last. */
  path: string[];
  /** `dataTableGroupPathId(path)` — the key into `nodesByPath`. */
  pathId: string;
  /** 0 for the outermost level. */
  depth: number;
  expanded: boolean;
  /** What this node holds when opened — sub-groups, or rows at the last level. */
  contains: "groups" | "rows";
  /** Expanded and nothing has arrived yet, or a refetch is in flight. */
  loading: boolean;
  error?: string | null;
  /** A load-more request for this node is in flight. */
  loadingMore: boolean;
  /** Sub-group sections. Empty unless this node is expanded and holds groups. */
  children: DataTableServerGroupSection<TData>[];
  /** Index of this group first row in the flattened row model. */
  rowStart: number;
  /** Number of loaded rows for this group (0 while collapsed). */
  rowCount: number;
  /**
   * Rows the server holds behind this group — `rowCount` may be a prefix of
   * it. This is what makes "showing 25 of 312" sayable instead of printing 25
   * under a header that said 312.
   */
  rowTotal: number;
  /** The rows node this section was built from, when it holds rows. */
  entry?: DataTableServerGroupRows<TData>;
}

export interface BuildServerGroupSectionsOptions<TData> {
  /** The current page of top-level groups. */
  groups: DataTableServerGroup[];
  /** Path ids the user has open, as `dataTableGroupPathId(path)`. */
  expandedPathIds: readonly string[];
  /** How many levels the grouping has. 1 = the single-level server mode. */
  levelCount: number;
  /** The caller node for an opened path, or `undefined` if not fetched yet. */
  resolveNode: (
    pathId: string,
    path: string[]
  ) => DataTableServerGroupNode<TData> | undefined;
}

export interface BuildServerGroupSectionsResult<TData> {
  sections: DataTableServerGroupSection<TData>[];
  /**
   * Every loaded row of every *visible* open node, in render order. Rows under
   * a collapsed ancestor are absent even when the caller still holds them —
   * that is what stops the table rendering stale descendants.
   */
  rows: TData[];
}

/**
 * Walks the group tree once, producing the render sections and the flat row
 * model together so a row can never be sliced into the wrong group.
 *
 * Recursion only descends into expanded nodes, so a collapsed parent hides its
 * whole subtree no matter what the caller still has cached or which
 * descendants are still listed in `expandedPathIds`.
 */
export function buildServerGroupSections<TData>({
  groups,
  expandedPathIds,
  levelCount,
  resolveNode,
}: BuildServerGroupSectionsOptions<TData>): BuildServerGroupSectionsResult<TData> {
  const expanded = new Set(expandedPathIds);
  const rows: TData[] = [];
  const lastLevel = Math.max(levelCount, 1) - 1;

  const walk = (
    levelGroups: DataTableServerGroup[],
    parentPath: string[],
    depth: number
  ): DataTableServerGroupSection<TData>[] =>
    levelGroups.map((group) => {
      const identity = dataTableGroupKeyId(group.key);
      const path = [...parentPath, identity];
      const pathId = dataTableGroupPathId(path);
      const isExpanded = expanded.has(pathId);
      const node = isExpanded ? resolveNode(pathId, path) : undefined;
      // The node itself says what it holds; depth is only the fallback for a
      // node that has not arrived yet, so the placeholder line reads right.
      const contains = node?.kind ?? (depth >= lastLevel ? "rows" : "groups");

      const rowStart = rows.length;
      let rowCount = 0;
      let rowTotal = 0;
      let children: DataTableServerGroupSection<TData>[] = [];

      if (node?.kind === "rows") {
        rowCount = node.rows.length;
        rowTotal = Math.max(node.total, rowCount);
        rows.push(...node.rows);
      } else if (node?.kind === "groups") {
        children = walk(node.groups, path, depth + 1);
      }

      return {
        group,
        identity,
        path,
        pathId,
        depth,
        expanded: isExpanded,
        contains,
        // No node yet = the caller has not answered the expand request. A
        // refresh over rows already on screen shows the line above them rather
        // than blanking the group.
        loading: isExpanded && (node == null || node.loading),
        error: isExpanded ? (node?.error ?? null) : null,
        loadingMore: Boolean(isExpanded && node?.loadingMore),
        children,
        rowStart,
        rowCount,
        rowTotal,
        entry: node?.kind === "rows" ? node : undefined,
      };
    });

  return { sections: walk(groups, [], 0), rows };
}

/** Path ids of every section currently rendered open, outermost first. */
export function collectExpandedPathIds<TData>(
  sections: DataTableServerGroupSection<TData>[],
  out: string[] = []
): string[] {
  sections.forEach((section) => {
    if (!section.expanded) return;
    out.push(section.pathId);
    collectExpandedPathIds(section.children, out);
  });
  return out;
}
