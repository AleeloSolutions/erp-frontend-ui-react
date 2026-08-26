import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../utils";
import { Checkbox } from "../../primitives/Checkbox";
import { Dropdown } from "../Dropdown";
import {
  SearchFilter,
  type SearchFilterChip,
  type SearchFilterItem,
} from "../SearchFilter";
import { DataTableBulkActions } from "./DataTableBulkActions";
import { DataTableColumnsMenu } from "./DataTableColumnsMenu";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableColumnResizer } from "./DataTableColumnResizer";
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
import { NAVBAR_HEIGHT, CONTROL_PANEL_HEIGHT } from "../../layout";
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

const VISIBILITY_STORAGE_PREFIX = "erp.datatable.visibility.";
/**
 * Floor for a resizable text column: padding (8px compact, each side) + a sort
 * icon (~14px incl. gap) + a couple of truncated characters — sized off the
 * shortest header label in practice ("Test"/"Status"). __select/__actions stay
 * fixed-size elsewhere and never hit this floor.
 */
const DEFAULT_COLUMN_MIN_SIZE = 44;
const DEFAULT_COLUMN_MAX_SIZE = 640;

export interface DataTableSearchConfig {
  value: string;
  onChange: (value: string) => void;
}

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /**
   * Stable id for this table instance. When set, column visibility persists
   * under `erp.datatable.visibility.${tableId}`. Column widths are
   * session-only — they always reset to their computed defaults on reload.
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
  /**
   * Render-prop that receives pre-built toolbar nodes. The page places these
   * inside a ControlPanel or any layout it wants. When omitted, no toolbar is
   * rendered and the table starts directly with headers.
   */
  renderToolbar?: (slots: {
    searchFilter: ReactNode;
    pagination: ReactNode;
    bulkActions: ReactNode;
  }) => ReactNode;
}

function getCellSearchText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function readStoredVisibility(tableId: string | undefined): VisibilityState {
  if (!tableId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${VISIBILITY_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: VisibilityState = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (key === "__select" || key === "__actions") continue;
      if (typeof value === "boolean") next[key] = value;
    }
    return next;
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
  renderToolbar,
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
  /** Last unchecked row — keeps hover-style checkbox + row emphasis until another row is unchecked. */
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    readStoredVisibility(tableId)
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    estimateDataColumnSizing(columns as ColumnDef<TData, unknown>[], data, {
      minSize: DEFAULT_COLUMN_MIN_SIZE,
      maxSize: DEFAULT_COLUMN_MAX_SIZE,
    })
  );
  const sizingLockedRef = useRef(false);
  const [columnResizeDirection, setColumnResizeDirection] = useState<"ltr" | "rtl">(
    "ltr"
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(40);
  // Sticky `top` for the header/resizer — Navbar + (optional) ControlPanel. Must be
  // measured: ControlPanel height is content-driven (`pt-2 pb-3` + row), not a fixed
  // constant, and at non-100% browser zoom getBoundingClientRect subpixels make a
  // hardcoded value (e.g. 99) drift into a 1px gap/overlap above the header.
  const [stickyTop, setStickyTop] = useState(
    () => NAVBAR_HEIGHT + (renderToolbar ? CONTROL_PANEL_HEIGHT : 0)
  );
  const [grouping, setGrouping] = useState<string[]>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: isServerPagination ? Math.max(0, pagination.page - 1) : 0,
    pageSize: isServerPagination ? pagination.pageSize : initialPageSize,
  });

  useEffect(() => {
    if (!tableId || !enableColumnVisibility || typeof window === "undefined") return;
    window.localStorage.setItem(
      `${VISIBILITY_STORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnVisibility)
    );
  }, [tableId, enableColumnVisibility, columnVisibility]);

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

    // The header row's real rendered height (not assumed) — table-cell `height`
    // acts as a floor, not a cap, so the actual `<th>` row can render taller
    // than its CSS `h-10`. DataTableColumnResizer's handles must match that
    // real height, or they under/overshoot the header row's own edges.
    //
    // `getBoundingClientRect()` returns a page-zoom-scaled px value (e.g. a
    // 40px header measures as ~60.5px at 150% browser zoom). Storing that raw
    // number and reapplying it as an inline `px` height on an element in the
    // same (zoomed) page scales it a *second* time at render — the handle
    // would grow to ~1.5x the header's real height instead of matching it
    // (confirmed live: 0px overshoot at 100% zoom, +30px at 150%). Every CSS
    // length unit (px, rem, em, ...) is equally subject to this — zoom is a
    // render-time multiplier applied after any unit resolves to a used value,
    // so switching units doesn't avoid it (also confirmed live). The only way
    // to compensate is to measure the *current zoom factor itself* — via a
    // probe with a hardcoded, author-known size — and divide it back out
    // before storing, so the browser's single (correct) re-multiplication at
    // render reconstructs the original measurement instead of doubling it.
    //
    // The same zoom correction applies to stickyTop: ControlPanel's height is
    // rem-padded/content-sized, so its CSS-px height shifts slightly across
    // zoom levels. A hardcoded top (99) leaves a 1px gap/overlap that grows
    // or shrinks with zoom and reads as the header "slipping" out of alignment.
    const measureZoomFactor = (parent: HTMLElement) => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;width:100px;height:0;pointer-events:none;";
      parent.appendChild(probe);
      const zoomFactor = probe.getBoundingClientRect().width / 100;
      parent.removeChild(probe);
      return zoomFactor;
    };

    const measure = () => {
      const width = Math.floor(node.clientWidth);
      if (width > 0) setContainerWidth(width);

      const zoomFactor = measureZoomFactor(node);
      if (zoomFactor <= 0) return;

      const theadEl = node.querySelector("thead");
      if (theadEl) {
        const height = theadEl.getBoundingClientRect().height;
        if (height > 0) setHeaderHeight(height / zoomFactor);
      }

      // Navbar is fixed `h-[46px]`; ControlPanel (renderToolbar sibling above
      // rootRef) must be measured. Divide zoom back out before storing.
      let nextSticky = NAVBAR_HEIGHT;
      if (renderToolbar) {
        const panel = rootRef.current?.previousElementSibling;
        if (panel instanceof HTMLElement) {
          nextSticky += panel.getBoundingClientRect().height / zoomFactor;
        } else {
          nextSticky += CONTROL_PANEL_HEIGHT;
        }
      }
      setStickyTop((prev) => (Math.abs(prev - nextSticky) > 0.05 ? nextSticky : prev));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const panel = rootRef.current?.previousElementSibling;
    if (panel instanceof HTMLElement) observer.observe(panel);
    window.addEventListener("resize", measure);
    visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      visualViewport?.removeEventListener("resize", measure);
    };
  }, [loading, error, renderToolbar]);

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
              active={!row.getIsSelected() && row.id === activeRowId}
              onChange={(event) => {
                const rowId = row.id;
                if (!event.target.checked) {
                  setActiveRowId(rowId);
                } else {
                  setActiveRowId((current) => (current === rowId ? null : current));
                }
                row.getToggleSelectedHandler()(event);
              }}
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
  }, [columns, selectable, getRowActions, activeRowId]);

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

  const totalColumnsWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, column) => sum + column.getSize(), 0);
  // Exact sum only — never `max(container, sum)`. Stretching a narrower sum up to
  // the container lets the browser redistribute extra pixels across columns while
  // overlay handles stay at cumulative `getSize()` edges, so the resize line
  // drifts off the real header/body boundary (especially after edge-shrink).
  // `normalizeSizingToWidth` already expands flexible columns to fill the
  // container at rest; interior resizes conserve that sum.
  const tableWidth = totalColumnsWidth > 0 ? totalColumnsWidth : containerWidth;
  // `overflow-x-auto` only goes on the wrapper when columns genuinely can't
  // fit (even the normalize-to-width effect above couldn't shrink them
  // enough) — not unconditionally. Browsers resolve a `position: sticky`
  // descendant's `top` against its nearest ancestor with non-`visible`
  // overflow on *either* axis (mixing rules force a lone `overflow-x` to
  // count); since that wrapper never scrolls independently of the page,
  // a sticky header inside it stops tracking the page scroll entirely once
  // it's present — confirmed by toggling it live against the running app.
  // Keeping the wrapper overflow-`visible` in the (overwhelmingly common)
  // case where columns already fit is what lets the header stay sticky.
  const needsHorizontalScroll = containerWidth > 0 && totalColumnsWidth > containerWidth;

  const pager = enablePagination ? (
    <DataTablePagination
      table={table}
      totalRows={totalRows}
      serverMode={isServerPagination}
    />
  ) : null;

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());
  const visibleHideableCount = hideableColumns.filter((column) =>
    column.getIsVisible()
  ).length;

  const columnsMenu =
    enableColumnVisibility && hideableColumns.length > 0 ? (
      <DataTableColumnsMenu
        items={hideableColumns.map((column) => ({
          id: column.id,
          label:
            typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id,
          isVisible: column.getIsVisible(),
          isDisabled: column.getIsVisible() && visibleHideableCount <= 1,
          onToggle: () => column.toggleVisibility(),
        }))}
      />
    ) : null;

  const searchFilterNode = showSearchFilter ? (
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
  ) : null;

  const bulkActionsNode = hasSelection ? (
    <DataTableBulkActions
      selectedCount={selectedRows.length}
      selectedRows={selectedRows}
      actions={bulkActions}
      onClear={() => {
        setRowSelection({});
        setActiveRowId(null);
      }}
    />
  ) : null;

  return (
    <>
      {renderToolbar?.({
        searchFilter: searchFilterNode,
        pagination: pager,
        bulkActions: bulkActionsNode,
      })}
      <div ref={rootRef} className={cn("bg-erp-table-bg", className)}>
        {error ? (
          <div className="grid min-h-[120px] place-items-center px-4 text-[0.875rem] text-erp-error">
            {error}
          </div>
        ) : loading ? (
          <DataTableLoading
            columns={table.getVisibleLeafColumns().length || columns.length + 1}
            stickyTop={stickyTop}
          />
        ) : (
          <div className="relative">
            {columnsMenu ? (
              // Zero-height sticky wrapper (mirrors DataTableColumnResizer below) so the
              // corner button tracks the sticky header without adding its own flow height
              // or scrolling horizontally with the table — it stays pinned to the viewport
              // edge the same way it sat outside `scrollRef` before.
              //
              // Must come *before* `scrollRef` in the DOM: `position: sticky` only holds an
              // element back from continuing to scroll past `top` — it never pulls an element
              // up to a position earlier than where it naturally sits in flow. As the last
              // sibling (after every row), this div's resting position was below the whole
              // table, and on a page short enough to never scroll that far it just stayed
              // there instead of snapping to the header corner.
              <div
                style={{ top: stickyTop }}
                className="pointer-events-none sticky z-30 h-0"
              >
                <div className="pointer-events-auto absolute end-0 top-0 grid h-10 w-9 place-items-center border-b border-erp-table-border bg-erp-table-header">
                  {columnsMenu}
                </div>
              </div>
            ) : null}
            <div
              ref={scrollRef}
              className={cn("w-full", needsHorizontalScroll && "overflow-x-auto")}
            >
              <DataTableColumnResizer
                table={table}
                enabled={enableColumnResizing}
                columnSizing={columnSizing}
                onColumnSizingChange={(next) => {
                  sizingLockedRef.current = true;
                  // Keep the table flush with the container when an edge-shrink
                  // would leave sum(cols) < containerWidth. Expanding via
                  // normalize (fill column absorbs the remainder) avoids the
                  // browser stretching a too-narrow table — which desyncs
                  // overlay handle positions from real cell edges. Overflow
                  // widths (sum > container) are left alone for horizontal scroll.
                  if (containerWidth > 0) {
                    const leafs = table.getVisibleLeafColumns();
                    const sum = leafs.reduce(
                      (total, column) => total + (next[column.id] ?? column.getSize()),
                      0
                    );
                    if (sum < containerWidth) {
                      const specs: SizingColumnSpec[] = leafs.map((column) => ({
                        id: column.id,
                        minSize: column.columnDef.minSize ?? DEFAULT_COLUMN_MIN_SIZE,
                        maxSize: column.columnDef.maxSize ?? DEFAULT_COLUMN_MAX_SIZE,
                        size: next[column.id] ?? column.getSize(),
                        fill: Boolean(column.columnDef.meta?.fill),
                        fixed:
                          column.id === "__select" ||
                          column.id === "__actions" ||
                          column.columnDef.enableResizing === false,
                      }));
                      setColumnSizing(
                        normalizeSizingToWidth(next, specs, containerWidth)
                      );
                      return;
                    }
                  }
                  setColumnSizing(next);
                }}
                columnResizeDirection={columnResizeDirection}
                stickyTop={stickyTop}
                headerHeight={headerHeight}
              />
              {/* `border-separate` (not `-collapse`) — a collapsed border shared between
                  a sticky `<th>` and its row is resolved/painted against the table's
                  static grid, not the cell's stuck position, so it silently drops once
                  the header engages `position: sticky` on scroll. `separate` makes each
                  cell own and paint its own border, immune to that. Safe here since every
                  cell only declares `border-b` (no vertical/top borders to double up). */}
              <table
                className="w-full table-fixed border-separate border-spacing-0 text-start tabular-nums"
                style={{
                  width: tableWidth > 0 ? tableWidth : "100%",
                }}
              >
                <colgroup>
                  {table.getVisibleLeafColumns().map((column) => (
                    <col key={column.id} style={getColumnWidthStyle(column)} />
                  ))}
                </colgroup>
                <DataTableHeader
                  table={table}
                  columnsMenu={columnsMenu}
                  stickyTop={stickyTop}
                />
                <DataTableBody
                  table={table}
                  emptyMessage={emptyMessage}
                  groupingColumnIds={grouping}
                  activeRowId={activeRowId}
                  onClearActiveRow={() => setActiveRowId(null)}
                />
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
