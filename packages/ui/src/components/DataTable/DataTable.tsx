import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { cn } from "../../utils";
import { Checkbox } from "../../primitives/Checkbox";
import { Dropdown } from "../Dropdown";
import {
  SearchFilter,
  type SearchFilterChip,
  type SearchFilterItem,
} from "../SearchFilter";
import { DataTableBulkActions } from "./DataTableBulkActions";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableBody } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableLoading } from "./DataTableLoading";
import {
  getColumnWidthStyle,
  estimateDataColumnSizing,
  normalizeSizingToWidth,
  type SizingColumnSpec,
} from "./column-width";
import { useDebounce } from "../../hooks/useDebounce";
import type {
  DataTableBulkAction,
  DataTableFilter,
  DataTableFilterValues,
  DataTableFilteringConfig,
  DataTableGroupingOption,
  DataTablePaginationConfig,
  DataTableRowAction,
  DataTableSortingConfig,
} from "../../types/table";
import "../../types/table";

const SIZING_STORAGE_PREFIX = "erp.datatable.sizing.";
const DEFAULT_COLUMN_MIN_SIZE = 72;
const DEFAULT_COLUMN_MAX_SIZE = 640;

export interface DataTableSearchConfig {
  value: string;
  onChange: (value: string) => void;
}

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /**
   * Stable id for this table instance. When set, column widths persist in
   * localStorage under `erp.datatable.sizing.${tableId}`.
   */
  tableId?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Controlled search. Use with `manualFiltering` for server-backed lists. */
  search?: DataTableSearchConfig;
  /**
   * When true, search/filter UI still works but rows are not filtered client-side
   * (parent/query owns filtering — typical with server pagination).
   */
  manualFiltering?: boolean;
  /**
   * Filters panel — record conditions (e.g. Status is Active / Inactive).
   * Options are values that match or exclude rows; not table-layout dimensions.
   */
  filters?: DataTableFilter[];
  selectable?: boolean;
  pagination?: boolean | DataTablePaginationConfig;
  pageSize?: number;
  bulkActions?: DataTableBulkAction<TData>[];
  /**
   * Per-row contextual actions for the MoreHorizontal menu.
   * When this returns items and no `__actions` column is supplied, DataTable
   * renders the menu column. When absent/empty and no `__actions` column exists,
   * no actions column is shown.
   */
  getRowActions?: (row: TData) => DataTableRowAction[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  enableColumnVisibility?: boolean;
  enableColumnResizing?: boolean;
  /**
   * When true, SearchFilter Group By lists dimensions (columns) to reorganize rows.
   * Pass `groupingOptions` for an explicit list; otherwise leaf data columns are used.
   */
  enableGrouping?: boolean;
  /** Group By dimensions — column ids/labels (not filter option values). */
  groupingOptions?: DataTableGroupingOption[];
  getRowId?: (originalRow: TData, index: number) => string;
  sorting?: DataTableSortingConfig;
  /**
   * Record conditions for the Filters panel (e.g. Status = Active).
   * Prefer discrete option values / predicates — not “group by column” choices.
   */
  filtering?: DataTableFilteringConfig;
  className?: string;
}

function getCellSearchText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function readStoredSizing(tableId: string | undefined): ColumnSizingState {
  if (!tableId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${SIZING_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ColumnSizingState;
  } catch {
    return {};
  }
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  tableId,
  searchable = false,
  searchPlaceholder,
  search: controlledSearch,
  manualFiltering = false,
  filters = [],
  selectable = false,
  pagination = true,
  pageSize: initialPageSize = 10,
  bulkActions = [],
  getRowActions,
  loading = false,
  error = null,
  emptyMessage,
  enableColumnVisibility = true,
  enableColumnResizing = true,
  enableGrouping = false,
  groupingOptions = [],
  getRowId,
  sorting: controlledSorting,
  filtering: controlledFiltering,
  className,
}: DataTableProps<TData, TValue>) {
  const isServerPagination = typeof pagination === "object";
  const enablePagination = pagination !== false;

  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch?.value ?? internalSearch;
  const setSearch = controlledSearch?.onChange ?? setInternalSearch;
  const debouncedSearch = useDebounce(search, 250);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalFilters, setInternalFilters] = useState<DataTableFilterValues>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    const stored = readStoredSizing(tableId);
    if (Object.keys(stored).length > 0) return stored;
    return estimateDataColumnSizing(columns as ColumnDef<TData, unknown>[], data, {
      minSize: DEFAULT_COLUMN_MIN_SIZE,
      maxSize: DEFAULT_COLUMN_MAX_SIZE,
    });
  });
  const sizingLockedRef = useRef(Object.keys(readStoredSizing(tableId)).length > 0);
  const [columnResizeDirection, setColumnResizeDirection] = useState<"ltr" | "rtl">(
    "ltr"
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [grouping, setGrouping] = useState<string[]>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: isServerPagination ? Math.max(0, pagination.page - 1) : 0,
    pageSize: isServerPagination ? pagination.pageSize : initialPageSize,
  });

  useEffect(() => {
    if (!tableId || typeof window === "undefined") return;
    if (Object.keys(columnSizing).length === 0) return;
    window.localStorage.setItem(
      `${SIZING_STORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnSizing)
    );
  }, [tableId, columnSizing]);

  useEffect(() => {
    if (sizingLockedRef.current) return;
    if (loading) return;
    if (data.length === 0) return;
    setColumnSizing(
      estimateDataColumnSizing(columns as ColumnDef<TData, unknown>[], data, {
        minSize: DEFAULT_COLUMN_MIN_SIZE,
        maxSize: DEFAULT_COLUMN_MAX_SIZE,
      })
    );
    sizingLockedRef.current = true;
  }, [loading, data, columns]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const measure = () => {
      const width = Math.floor(node.clientWidth);
      if (width > 0) setContainerWidth(width);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, error]);

  useEffect(() => {
    const readDirection = () => {
      const hostedDir =
        rootRef.current?.closest("[dir]")?.getAttribute("dir") ??
        document.documentElement.getAttribute("dir") ??
        "ltr";
      setColumnResizeDirection(hostedDir === "rtl" ? "rtl" : "ltr");
    };

    readDirection();

    const observer = new MutationObserver(readDirection);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => observer.disconnect();
  }, []);

  const sorting = controlledSorting?.state ?? internalSorting;
  const setSorting = controlledSorting?.onChange ?? setInternalSorting;
  const filterValues = controlledFiltering?.state ?? internalFilters;
  const setFilterValues = controlledFiltering?.onChange ?? setInternalFilters;

  const tableColumns = useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = [...columns];

    if (selectable) {
      cols.unshift({
        id: "__select",
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: ({ table }) => (
          <div className="grid h-10 w-full place-items-center">
            <Checkbox
              aria-label="Select all rows"
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="grid h-10 w-full place-items-center">
            <Checkbox
              aria-label="Select row"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      } as ColumnDef<TData, TValue>);
    }

    const hasActions = cols.some((column) => column.id === "__actions");
    if (!hasActions && getRowActions) {
      cols.push({
        id: "__actions",
        size: 36,
        minSize: 36,
        maxSize: 36,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => null,
        cell: ({ row }) => {
          const items = getRowActions(row.original);
          if (!items.length) return null;
          return (
            <div className="grid h-10 w-full place-items-center">
              <Dropdown
                hideChevron
                align="right"
                label={<MoreHorizontal className="h-3.5 w-3.5" aria-hidden />}
                buttonProps={{
                  variant: "ghost",
                  size: "icon",
                  "aria-label": "Row actions",
                  className:
                    "h-7 w-7 text-erp-muted hover:bg-erp-table-odd-hover hover:border-transparent",
                }}
                items={items}
              />
            </div>
          );
        },
      } as ColumnDef<TData, TValue>);
    }

    return cols.map((column) => {
      if (column.id === "__select" || column.id === "__actions") {
        return {
          ...column,
          enableResizing: false,
          minSize: column.minSize ?? column.size ?? 36,
          maxSize: column.maxSize ?? column.size ?? 36,
        };
      }
      return {
        ...column,
        minSize: column.minSize ?? DEFAULT_COLUMN_MIN_SIZE,
        maxSize: column.maxSize ?? DEFAULT_COLUMN_MAX_SIZE,
      };
    });
  }, [columns, selectable, getRowActions]);

  const filteredBySearch = useMemo(() => {
    if (manualFiltering) return data;

    let rows = data;

    if (searchable && debouncedSearch.trim()) {
      const query = debouncedSearch.trim().toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row as Record<string, unknown>)
          .map(getCellSearchText)
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    filters.forEach((filter) => {
      const raw = filterValues[filter.key];
      if (Array.isArray(raw)) {
        if (raw.length === 0) return;
        rows = rows.filter((row) => {
          const value = String((row as Record<string, unknown>)[filter.key] ?? "");
          return raw.includes(value);
        });
        return;
      }
      if (!raw) return;
      rows = rows.filter((row) => {
        const value = String(
          (row as Record<string, unknown>)[filter.key] ?? ""
        ).toLowerCase();
        const needle = String(raw).toLowerCase();
        if (filter.type === "text") return value.includes(needle);
        return value === needle;
      });
    });

    return rows;
  }, [data, searchable, debouncedSearch, filters, filterValues, manualFiltering]);

  const table = useReactTable({
    data: filteredBySearch,
    columns: tableColumns,
    defaultColumn: {
      minSize: DEFAULT_COLUMN_MIN_SIZE,
      maxSize: DEFAULT_COLUMN_MAX_SIZE,
    },
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnSizing,
      pagination: isServerPagination
        ? {
            pageIndex: Math.max(0, pagination.page - 1),
            pageSize: pagination.pageSize,
          }
        : paginationState,
    },
    getRowId,
    enableRowSelection: selectable,
    enableColumnResizing,
    columnResizeMode: "onChange",
    columnResizeDirection,
    autoResetPageIndex: false,
    manualPagination: isServerPagination,
    pageCount: isServerPagination
      ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
      : undefined,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: (updater) => {
      sizingLockedRef.current = true;
      setColumnSizing((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    onPaginationChange: (updater) => {
      if (isServerPagination) {
        const current = {
          pageIndex: Math.max(0, pagination.page - 1),
          pageSize: pagination.pageSize,
        };
        const next = typeof updater === "function" ? updater(current) : updater;
        if (next.pageIndex !== current.pageIndex) {
          pagination.onPageChange(next.pageIndex + 1);
        }
        if (next.pageSize !== current.pageSize) {
          pagination.onPageSizeChange?.(next.pageSize);
        }
        return;
      }
      setPaginationState(updater);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  });

  // Keep column pixel sizes summing to the measured container width.
  const visibleLeafKey = table
    .getVisibleLeafColumns()
    .map((column) => column.id)
    .join("|");

  useEffect(() => {
    if (containerWidth <= 0) return;
    const leafs = table.getVisibleLeafColumns();
    if (leafs.length === 0) return;

    setColumnSizing((prev) => {
      const specs: SizingColumnSpec[] = leafs.map((column) => ({
        id: column.id,
        minSize: column.columnDef.minSize ?? DEFAULT_COLUMN_MIN_SIZE,
        maxSize: column.columnDef.maxSize ?? DEFAULT_COLUMN_MAX_SIZE,
        size: prev[column.id] ?? column.getSize(),
        fill: Boolean(column.columnDef.meta?.fill),
        fixed:
          column.id === "__select" ||
          column.id === "__actions" ||
          column.columnDef.enableResizing === false,
      }));

      const next = normalizeSizingToWidth(prev, specs, containerWidth);
      const unchanged = leafs.every(
        (column) => (next[column.id] ?? 0) === (prev[column.id] ?? column.getSize())
      );
      return unchanged ? prev : next;
    });
    // table is read for leaf column defs; re-run when width or visible set changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-normalize every render
  }, [containerWidth, visibleLeafKey]);

  const resolvedGroupingOptions = useMemo(() => {
    if (!enableGrouping) return [];
    if (groupingOptions.length > 0) return groupingOptions;
    // Dimensions = table columns (not filter option values)
    return table
      .getAllLeafColumns()
      .filter((column) => column.id !== "__select" && column.id !== "__actions")
      .map((column) => ({
        label:
          typeof column.columnDef.header === "string"
            ? column.columnDef.header
            : column.id,
        value: column.id,
      }));
  }, [enableGrouping, groupingOptions, table]);

  const totalRows = isServerPagination ? pagination.total : filteredBySearch.length;

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  function handleFilterChange(key: string, value: string | string[]) {
    setFilterValues({
      ...filterValues,
      [key]: value,
    });
    if (!isServerPagination) {
      setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }

  const searchFilterChips: SearchFilterChip[] = [];

  filters.forEach((filter) => {
    const value = filterValues[filter.key];
    const selected = Array.isArray(value)
      ? value
      : typeof value === "string" && value
        ? [value]
        : [];
    if (selected.length === 0) return;

    const labels = selected.map(
      (item) => filter.options?.find((option) => option.value === item)?.label ?? item
    );
    searchFilterChips.push({
      id: filter.key,
      label: labels[0] ?? filter.label,
      values: labels,
      kind: "filter",
      onRemove: () => handleFilterChange(filter.key, Array.isArray(value) ? [] : ""),
    });
  });

  if (grouping.length > 0) {
    const labels = grouping.map(
      (groupId) =>
        resolvedGroupingOptions.find((item) => item.value === groupId)?.label ?? groupId
    );
    searchFilterChips.push({
      id: "group",
      label: labels[0] ?? "Group",
      values: labels,
      kind: "group",
      onRemove: () => setGrouping([]),
    });
  }

  const panelFilterItems: SearchFilterItem[] = [];
  filters.forEach((filter, filterIndex) => {
    if (
      filter.type === "select" ||
      filter.type === "date" ||
      filter.type === "multi-select"
    ) {
      const raw = filterValues[filter.key];
      const selected = Array.isArray(raw)
        ? raw
        : typeof raw === "string" && raw
          ? [raw]
          : [];
      (filter.options ?? []).forEach((option, optionIndex) => {
        const isChecked = selected.includes(option.value);
        panelFilterItems.push({
          id: `${filter.key}:${option.value}`,
          label: option.label,
          checked: isChecked,
          dividerBefore: filterIndex > 0 && optionIndex === 0,
          onSelect: () =>
            handleFilterChange(
              filter.key,
              isChecked
                ? selected.filter((entry) => entry !== option.value)
                : [...selected, option.value]
            ),
        });
      });
    }
  });

  const panelGroupItems: SearchFilterItem[] = resolvedGroupingOptions.map((option) => {
    const isActive = grouping.includes(option.value);
    return {
      id: option.value,
      label: option.label,
      checked: isActive,
      active: isActive,
      onSelect: () =>
        setGrouping((prev) =>
          prev.includes(option.value)
            ? prev.filter((id) => id !== option.value)
            : [...prev, option.value]
        ),
    };
  });

  const showSearchFilter =
    searchable || filters.length > 0 || resolvedGroupingOptions.length > 0;
  const hasSelection = selectedRows.length > 0;
  const showSearchSlot = showSearchFilter || hasSelection;

  const columnsMenu = enableColumnVisibility ? (
    <Dropdown
      trigger="button"
      hideChevron
      label={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />}
      align="right"
      buttonProps={{
        variant: "ghost",
        size: "icon",
        "aria-label": "Columns",
        className:
          "h-6 w-6 rounded-md border-0 bg-transparent p-0 text-erp-text shadow-none hover:bg-erp-table-odd-hover hover:border-transparent",
      }}
      items={table
        .getAllLeafColumns()
        .filter((column) => column.getCanHide())
        .map((column) => ({
          key: column.id,
          label: `${column.getIsVisible() ? "Hide" : "Show"} ${
            typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id
          }`,
          onClick: () => column.toggleVisibility(),
        }))}
    />
  ) : null;

  return (
    <div ref={rootRef} className={cn("bg-erp-table-bg", className)}>
      {showSearchSlot ? (
        <div className="relative z-20 overflow-visible border-b border-erp-table-border bg-erp-table-header px-4 py-2">
          {hasSelection ? (
            <DataTableBulkActions
              selectedCount={selectedRows.length}
              selectedRows={selectedRows}
              actions={bulkActions}
              onClear={() => setRowSelection({})}
            />
          ) : (
            <SearchFilter
              value={searchable ? search : ""}
              onChange={(value) => {
                if (!searchable) return;
                setSearch(value);
                if (!isServerPagination) {
                  setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
                }
              }}
              readOnly={!searchable}
              placeholder={searchable ? (searchPlaceholder ?? "Search...") : "Search..."}
              chips={searchFilterChips}
              filters={panelFilterItems}
              groupBy={panelGroupItems}
            />
          )}
        </div>
      ) : null}

      {error ? (
        <div className="grid min-h-[120px] place-items-center px-4 text-[0.875rem] text-erp-error">
          {error}
        </div>
      ) : loading ? (
        <DataTableLoading
          columns={table.getVisibleLeafColumns().length || columns.length + 1}
        />
      ) : (
        <>
          <div className="relative overflow-hidden">
            <div ref={scrollRef} className="w-full overflow-auto">
              <table
                className="w-full table-fixed border-collapse tabular-nums"
                style={{
                  width: containerWidth > 0 ? containerWidth : "100%",
                }}
              >
                <colgroup>
                  {table.getVisibleLeafColumns().map((column) => (
                    <col key={column.id} style={getColumnWidthStyle(column)} />
                  ))}
                </colgroup>
                <DataTableHeader
                  table={table}
                  enableResizing={enableColumnResizing}
                  columnResizeDirection={columnResizeDirection}
                  columnSizing={columnSizing}
                  onColumnSizingChange={(next) => {
                    sizingLockedRef.current = true;
                    setColumnSizing(next);
                  }}
                  columnsMenu={columnsMenu}
                />
                <DataTableBody
                  table={table}
                  emptyMessage={emptyMessage}
                  groupingColumnIds={grouping}
                />
              </table>
            </div>
            {columnsMenu ? (
              <div className="absolute end-0 top-0 z-30 grid h-10 w-9 place-items-center border-b border-erp-table-border bg-erp-table-header">
                {columnsMenu}
              </div>
            ) : null}
          </div>
          {enablePagination ? (
            <DataTablePagination
              table={table}
              totalRows={totalRows}
              serverMode={isServerPagination}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
