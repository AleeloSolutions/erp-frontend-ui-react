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
  /** Rows the server holds for this group — may exceed `rows.length`. */
  total: number;
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
   */
  aggregate: DataTableServerGroupAggregate;
  /** The group page itself is loading (not a single group's rows). */
  loading?: boolean;
  /** The group page failed to load. */
  error?: string | null;
  /**
   * Rows per opened group, keyed by `dataTableGroupKeyId(group.key)`
   * (`__none__` for the null group). A missing entry for an expanded group
   * reads as "not fetched yet" and renders the in-group loading state.
   */
  rowsByGroup: Record<string, DataTableServerGroupRows<TData>>;
  /**
   * Fires with the full set of expanded group identities whenever one is
   * opened or closed, and with `[]` when expansion resets.
   */
  onExpandedChange: (expandedKeys: string[]) => void;
  /**
   * Refetch one group's rows. When omitted, a failed group shows its error
   * without a retry control (no dead buttons).
   */
  onRetryGroup?: (groupKey: string) => void;
  /** Group pager. Without it, no pager is rendered in this mode. */
  pagination?: DataTableServerGroupPaginationConfig;
  /**
   * Pill on every group row naming the grouped dimension (e.g. "Customer"),
   * matching the period pill on client-side group rows.
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
