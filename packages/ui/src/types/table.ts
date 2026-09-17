import type { ReactNode } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ButtonVariant } from "./common";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
    /** When true, column is preferred to absorb leftover / remainder width. */
    fill?: boolean;
    /** Tooltip shown on column header hover (defaults to header label). */
    tooltip?: string;
  }
}

export type DataTableFilterType =
  "text" | "select" | "multi-select" | "date" | "date-presets";

export interface DataTableFilterOption {
  label: string;
  value: string;
  /** Nested options (Odoo Create Date → months / quarters / years). */
  children?: DataTableFilterOption[];
  /** Expand-only parent row (no checkbox). */
  selectable?: boolean;
  /** Opens From–To editors when selected. Value uses `custom:from:to`. */
  customRange?: boolean;
  /** Hairline above this option (e.g. before year block). */
  dividerBefore?: boolean;
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: DataTableFilterType;
  options?: DataTableFilterOption[];
  placeholder?: string;
  /**
   * For `date-presets`: row field used for client-side range matching.
   * Defaults to `key` when omitted.
   */
  dateField?: string;
}

export type DataTableFilterValues = Record<string, string | string[]>;

export interface DataTableBulkAction<TData> {
  key?: string;
  label: string;
  onClick: (rows: TData[]) => void;
  variant?: ButtonVariant;
}

/** Contextual per-row menu items for the MoreHorizontal actions pattern. */
export interface DataTableRowAction {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DataTablePaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableSortingConfig {
  state: SortingState;
  onChange: (sorting: SortingState) => void;
}

export interface DataTableFilteringConfig {
  state: DataTableFilterValues;
  onChange: (filters: DataTableFilterValues) => void;
}

export interface DataTableGroupingOption {
  /** Display label for the Group By panel (column / dimension name). */
  label: string;
  /**
   * Column id used to reorganize rows — not a filter option value.
   * For expandable date parents, use a stable id (e.g. `order_date`); children
   * hold the real `__period:…` / column ids.
   */
  value: string;
  children?: DataTableGroupingOption[];
  /** Expand-only parent (Odoo “Order Date”) when false. */
  selectable?: boolean;
  defaultExpanded?: boolean;
  /**
   * When set on a parent, children are period grains over this row date field.
   * Child `value`s should be `periodGroupingColumnId(grain, dateField)`.
   */
  dateField?: string;
}

/**
 * One group row produced by the server.
 *
 * Purely structural: the table knows a group has a label, a record count and a
 * map of amounts, and nothing about what the records are.
 */
export interface DataTableServerGroup {
  /**
   * Opaque group identity. `null` only when the grouped column itself is null
   * for those records (e.g. records with no assignee); addressed everywhere
   * else by `dataTableGroupKeyId(key)`.
   */
  key: string | null;
  /** Resolved server-side — the table never looks anything up. */
  label: string;
  /** Records in the whole group, not in the rows currently loaded. */
  count: number;
  /**
   * Currency code → amount as a decimal string. Rendered one amount per
   * currency; amounts in different currencies are never added together.
   */
  totals: Record<string, string>;
}

/** Rows fetched for one opened group. */
export interface DataTableServerGroupRows<TData> {
  rows: TData[];
  loading: boolean;
  error?: string | null;
  /**
   * Rows the server holds for this group — may exceed `rows.length`.
   *
   * When it does, the table says so inside the group ("Showing 25 of 312")
   * rather than letting a header that reads 312 be followed by 25 rows and no
   * sign that the rest exist.
   */
  total: number;
  /** A request for the next page of this group's rows is in flight. */
  loadingMore?: boolean;
}

/**
 * One level of a grouping chain, outermost first — the shape behind
 * "Salesperson > Customer > Order Date: Year".
 */
export interface DataTableServerGroupLevel {
  /**
   * Pill on every group row at this level (e.g. "Customer"). The outermost
   * level falls back to `groupLabel`.
   */
  label?: string;
  /**
   * The caller's own dimension id for this level — typically the `group_by`
   * token it will send back when a node at this depth is opened. Opaque to the
   * table, which never reads it.
   */
  id?: string;
}

interface DataTableServerGroupNodeState {
  /** This node's own fetch is in flight. Never blanks the rest of the table. */
  loading: boolean;
  error?: string | null;
  /** A request for this node's next page of children is in flight. */
  loadingMore?: boolean;
}

/** An opened node above the last level: it holds sub-groups, not records. */
export interface DataTableServerGroupChildGroups extends DataTableServerGroupNodeState {
  kind: "groups";
  /**
   * Sub-groups of this node, each with its own count and per-currency totals —
   * the same `DataTableServerGroup` the top level is made of, so every level
   * renders identically however deep it sits.
   */
  groups: DataTableServerGroup[];
}

/** An opened node at the last level: it holds records. */
export interface DataTableServerGroupChildRows<TData>
  extends DataTableServerGroupNodeState, DataTableServerGroupRows<TData> {
  kind: "rows";
}

/**
 * What one opened node contains. `kind` is the discriminant the table trusts —
 * the caller knows which level it requested, so it can set it before the
 * response lands.
 */
export type DataTableServerGroupNode<TData> =
  DataTableServerGroupChildGroups | DataTableServerGroupChildRows<TData>;

/**
 * Nested server grouping — the multi-level form of the mode below.
 *
 * Each request returns exactly one level: the page of top-level groups comes
 * in `groups`, and opening any node asks the caller for that node's children,
 * which are sub-groups until the last level and records at it. Nothing is
 * fetched until it is opened, at any depth.
 */
export interface DataTableServerGroupNestingConfig<TData> {
  /**
   * The grouping chain, outermost first. `levels.length` is the depth at which
   * children stop being groups and start being rows.
   */
  levels: DataTableServerGroupLevel[];
  /**
   * Opened nodes keyed by `dataTableGroupPathId(path)`. A missing entry for an
   * open node reads as "not fetched yet" and renders that node's own loading
   * line — inside the node, so the rest of the tree stays readable.
   */
  nodesByPath: Record<string, DataTableServerGroupNode<TData>>;
  /**
   * A node became visible-and-open: fetch it. Fires with the path that opened
   * (group identities, outermost first), including when re-opening a parent
   * brings previously-open descendants back on screen — so callers should
   * serve this from their cache when they already hold the node.
   */
  onExpand: (path: string[]) => void;
  /**
   * Refetch one node. When omitted, a failed node shows its error without a
   * retry control (no dead buttons).
   */
  onRetry?: (path: string[]) => void;
  /**
   * Fetch the next page of a node's rows and append them. When omitted, a
   * partially loaded node still says "Showing 25 of 312" but renders no
   * control — an honest count beats a button that does nothing.
   */
  onLoadMore?: (path: string[]) => void;
}

/** Whole filtered set, as reported by the server. */
export interface DataTableServerGroupAggregate {
  count: number;
  totals: Record<string, string>;
}

/** Pages GROUPS, not records. */
export interface DataTableServerGroupPaginationConfig {
  page: number;
  pageSize: number;
  /** Number of groups in the whole filtered set. */
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Opt-in server-grouped mode for `DataTable`.
 *
 * Groups, counts and totals are computed by the server over the whole filtered
 * set; the table renders them and asks for a group's rows only when it is
 * opened. This is the alternative to the client-side `enableGrouping` model,
 * which can only group the rows it already holds.
 */
export interface DataTableServerGroupingConfig<TData> {
  /** The current page of groups. */
  groups: DataTableServerGroup[];
  /**
   * Totals over the WHOLE filtered set, for the grand-total footer. Never
   * derive this from `groups`: that would total only the groups on screen.
   *
   * This is the only aggregate the footer ever shows. A nested level's own
   * count and totals live on its group row, where they are scoped by the
   * label above them — they never reach the footer.
   */
  aggregate: DataTableServerGroupAggregate;
  /** The group page itself is loading (not a single group's rows). */
  loading?: boolean;
  /** The group page failed to load. */
  error?: string | null;
  /**
   * SINGLE-LEVEL mode: rows per opened group, keyed by
   * `dataTableGroupKeyId(group.key)` (`__none__` for the null group). A missing
   * entry for an expanded group reads as "not fetched yet" and renders the
   * in-group loading state.
   *
   * Ignored when `nesting` is set — a nested grouping addresses every node,
   * including the top one, through `nesting.nodesByPath`.
   */
  rowsByGroup?: Record<string, DataTableServerGroupRows<TData>>;
  /**
   * NESTED mode: sub-groups under sub-groups, rows only at the last level.
   *
   * Set this instead of `rowsByGroup` when the grouping has more than one
   * dimension. `groups` still carries the top level, so the two modes differ
   * only in what an opened node contains.
   */
  nesting?: DataTableServerGroupNestingConfig<TData>;
  /**
   * Fires with the full set of expanded nodes whenever one is opened or
   * closed, and with `[]` when expansion resets.
   *
   * Identities in single-level mode; `dataTableGroupPathId(path)` values in
   * nested mode — which are the identity itself at the top level, so the two
   * agree there. This mirrors state; `nesting.onExpand` is the fetch trigger.
   */
  onExpandedChange: (expandedKeys: string[]) => void;
  /**
   * SINGLE-LEVEL mode: refetch one group's rows. When omitted, a failed group
   * shows its error without a retry control (no dead buttons). Nested mode
   * uses `nesting.onRetry`.
   */
  onRetryGroup?: (groupKey: string) => void;
  /**
   * SINGLE-LEVEL mode: fetch the next page of one group's rows and append them
   * to its `rowsByGroup` entry. When omitted, a group that holds fewer rows
   * than its `total` still says so but renders no control. Nested mode uses
   * `nesting.onLoadMore`.
   */
  onLoadMoreGroup?: (groupKey: string) => void;
  /**
   * Rows one row request asks for. Only sizes the load-more label ("Load 25
   * more"); when omitted the label uses the page already delivered.
   */
  rowPageSize?: number;
  /** Group pager. Without it, no pager is rendered in this mode. */
  pagination?: DataTableServerGroupPaginationConfig;
  /**
   * Pill on every group row naming the grouped dimension (e.g. "Customer"),
   * matching the period pill on client-side group rows. In nested mode it is
   * the fallback for the outermost level; deeper levels are named by
   * `nesting.levels[depth].label`.
   */
  groupLabel?: string;
  /**
   * Renders one currency's amount. Defaults to `CODE amount`; pass a formatter
   * (or pre-formatted strings in `totals`) for `$1,200.00`.
   */
  formatAmount?: (amount: string, currency: string) => ReactNode;
}

export interface DataTableChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue>;
