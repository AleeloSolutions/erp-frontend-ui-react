import { useMemo, useState } from "react";
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
import { Columns3, MoreHorizontal } from "lucide-react";
import { cn } from "../../utils";
import { Checkbox } from "../../primitives/Checkbox";
import { Dropdown } from "../Dropdown";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableFilters } from "./DataTableFilters";
import { DataTableBulkActions } from "./DataTableBulkActions";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableBody } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableLoading } from "./DataTableLoading";
import { getColumnWidthStyle } from "./column-width";
import { useDebounce } from "../../hooks/useDebounce";
import type {
  DataTableBulkAction,
  DataTableChip,
  DataTableFilter,
  DataTableFilterValues,
  DataTableFilteringConfig,
  DataTableGroupingOption,
  DataTablePaginationConfig,
  DataTableSortingConfig,
} from "../../types/table";
import "../../types/table";

export interface DataTableSearchConfig {
  value: string;
  onChange: (value: string) => void;
}

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Controlled search. Use with `manualFiltering` for server-backed lists. */
  search?: DataTableSearchConfig;
  /**
   * When true, search/filter UI still works but rows are not filtered client-side
   * (parent/query owns filtering — typical with server pagination).
   */
  manualFiltering?: boolean;
  filters?: DataTableFilter[];
  selectable?: boolean;
  pagination?: boolean | DataTablePaginationConfig;
  pageSize?: number;
  bulkActions?: DataTableBulkAction<TData>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  enableColumnVisibility?: boolean;
  enableColumnResizing?: boolean;
  enableGrouping?: boolean;
  groupingOptions?: DataTableGroupingOption[];
  getRowId?: (originalRow: TData, index: number) => string;
  sorting?: DataTableSortingConfig;
  filtering?: DataTableFilteringConfig;
  className?: string;
}

function getCellSearchText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  searchable = false,
  searchPlaceholder,
  search: controlledSearch,
  manualFiltering = false,
  filters = [],
  selectable = false,
  pagination = true,
  pageSize: initialPageSize = 10,
  bulkActions = [],
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
  const [internalFilters, setInternalFilters] = useState<DataTableFilterValues>(
    {}
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [grouping, setGrouping] = useState("");
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: isServerPagination ? Math.max(0, pagination.page - 1) : 0,
    pageSize: isServerPagination ? pagination.pageSize : initialPageSize,
  });

  const sorting = controlledSorting?.state ?? internalSorting;
  const setSorting = controlledSorting?.onChange ?? setInternalSorting;
  const filterValues = controlledFiltering?.state ?? internalFilters;
  const setFilterValues =
    controlledFiltering?.onChange ?? setInternalFilters;

  const tableColumns = useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = [...columns];

    if (selectable) {
      cols.unshift({
        id: "__select",
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: ({ table }) => (
          <div className="grid h-8 w-full place-items-center">
            <Checkbox
              aria-label="Select all rows"
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="grid h-[34px] w-full place-items-center">
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
    if (!hasActions) {
      cols.push({
        id: "__actions",
        size: 52,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => null,
        cell: () => (
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md border border-transparent text-[#667085] hover:border-[#D9E2EC] hover:bg-[#F5F8FC]"
            aria-label="Row actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        ),
      } as ColumnDef<TData, TValue>);
    }

    return cols;
  }, [columns, selectable]);

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
          const value = String(
            (row as Record<string, unknown>)[filter.key] ?? ""
          );
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
  }, [
    data,
    searchable,
    debouncedSearch,
    filters,
    filterValues,
    manualFiltering,
  ]);

  const table = useReactTable({
    data: filteredBySearch,
    columns: tableColumns,
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
    onColumnSizingChange: setColumnSizing,
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
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
  });

  const sortableColumns = useMemo(
    () =>
      table
        .getAllLeafColumns()
        .filter(
          (column) =>
            column.getCanSort() &&
            column.id !== "__select" &&
            column.id !== "__actions"
        )
        .map((column) => ({
          id: column.id,
          label:
            typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id,
        })),
    [table]
  );

  const resolvedGroupingOptions = useMemo(() => {
    if (!enableGrouping) return [];
    if (groupingOptions.length > 0) return groupingOptions;
    return sortableColumns.map((column) => ({
      label: column.label,
      value: column.id,
    }));
  }, [enableGrouping, groupingOptions, sortableColumns]);

  const totalRows = isServerPagination
    ? pagination.total
    : filteredBySearch.length;

  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

  const chips: DataTableChip[] = [];

  if (searchable && search.trim()) {
    chips.push({
      key: "search",
      label: "Search",
      value: search.trim(),
      onRemove: () => setSearch(""),
    });
  }

  filters.forEach((filter) => {
    const value = filterValues[filter.key];
    if (Array.isArray(value) && value.length > 0) {
      const labels = value
        .map(
          (item) =>
            filter.options?.find((option) => option.value === item)?.label ??
            item
        )
        .join(", ");
      chips.push({
        key: filter.key,
        label: filter.label,
        value: labels,
        onRemove: () =>
          setFilterValues({
            ...filterValues,
            [filter.key]: [],
          }),
      });
    } else if (typeof value === "string" && value) {
      const label =
        filter.options?.find((option) => option.value === value)?.label ??
        value;
      chips.push({
        key: filter.key,
        label: filter.label,
        value: label,
        onRemove: () =>
          setFilterValues({
            ...filterValues,
            [filter.key]: "",
          }),
      });
    }
  });

  if (grouping) {
    const groupLabel =
      resolvedGroupingOptions.find((item) => item.value === grouping)?.label ??
      grouping;
    chips.push({
      key: "group",
      label: "Group",
      value: groupLabel,
      onRemove: () => setGrouping(""),
    });
  }

  if (sorting[0]) {
    const sortCol = sortableColumns.find((item) => item.id === sorting[0].id);
    chips.push({
      key: "sort",
      label: "Sort",
      value: `${sortCol?.label ?? sorting[0].id} ${
        sorting[0].desc ? "descending" : "ascending"
      }`,
      onRemove: () => setSorting([]),
    });
  }

  function clearAll() {
    setSearch("");
    setFilterValues({});
    setGrouping("");
    setSorting([]);
    if (!isServerPagination) {
      setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }

  function handleFilterChange(key: string, value: string | string[]) {
    setFilterValues({
      ...filterValues,
      [key]: value,
    });
    if (!isServerPagination) {
      setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }

  function handleSortingPresetChange(value: string) {
    if (value === "default") {
      setSorting([]);
      return;
    }
    const [direction, id] = value.split(":");
    if (!id) return;
    setSorting([{ id, desc: direction === "desc" }]);
  }

  const visibilityItems = table
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
    }));

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-erp-border bg-white",
        className
      )}
    >
      <DataTableToolbar
        searchable={searchable}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          if (!isServerPagination) {
            setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
          }
        }}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={clearAll}
        groupingOptions={resolvedGroupingOptions}
        grouping={grouping}
        onGroupingChange={setGrouping}
        sortableColumns={sortableColumns}
        sorting={sorting}
        onSortingPresetChange={handleSortingPresetChange}
        columnVisibilityToggle={
          enableColumnVisibility ? (
            <Dropdown
              label={
                <>
                  <Columns3 className="h-3.5 w-3.5" aria-hidden />
                  Columns
                </>
              }
              align="right"
              buttonProps={{
                variant: "secondary",
                className: "h-10 rounded-[10px] px-3.5",
              }}
              items={visibilityItems}
            />
          ) : null
        }
      />

      <DataTableFilters
        chips={chips}
        resultCount={totalRows}
        onClearAll={chips.length > 0 ? clearAll : undefined}
      />

      <DataTableBulkActions
        selectedCount={selectedRows.length}
        selectedRows={selectedRows}
        actions={bulkActions}
      />

      {error ? (
        <div className="grid min-h-[120px] place-items-center px-3 text-[11px] text-erp-error">
          {error}
        </div>
      ) : loading ? (
        <DataTableLoading
          columns={table.getVisibleLeafColumns().length || columns.length + 1}
        />
      ) : (
        <>
          <div className="overflow-auto">
            <table
              className="w-full min-w-full table-fixed border-separate border-spacing-0"
              style={{ minWidth: table.getCenterTotalSize() }}
            >
              <colgroup>
                {table.getVisibleLeafColumns().map((column) => (
                  <col key={column.id} style={getColumnWidthStyle(column)} />
                ))}
              </colgroup>
              <DataTableHeader
                table={table}
                enableResizing={enableColumnResizing}
              />
              <DataTableBody
                table={table}
                emptyMessage={emptyMessage}
                groupingColumnId={grouping || undefined}
              />
            </table>
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
