import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ButtonVariant } from "./common";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
    /** When true, column absorbs leftover table width (no fixed pixel width). */
    fill?: boolean;
  }
}

export type DataTableFilterType = "text" | "select" | "multi-select" | "date";

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: DataTableFilterType;
  options?: DataTableFilterOption[];
  placeholder?: string;
}

export type DataTableFilterValues = Record<string, string | string[]>;

export interface DataTableBulkAction<TData> {
  key?: string;
  label: string;
  onClick: (rows: TData[]) => void;
  variant?: ButtonVariant;
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
  label: string;
  value: string;
}

export interface DataTableChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
>;
