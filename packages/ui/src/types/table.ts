import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ButtonVariant } from "./common";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/unused-vars
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

export interface DataTableChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue>;
