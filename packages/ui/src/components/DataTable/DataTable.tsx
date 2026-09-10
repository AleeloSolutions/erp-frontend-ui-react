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
import {
  bucketDate,
  cn,
  dateMatchesFilterTokens,
  encodeCustomRange,
  isCustomRangeValue,
  labelForDateFilterToken,
  parseCustomRange,
  parsePeriodGroupingColumnId,
  sortPeriodGrains,
  toISODate,
  type PeriodGrain,
} from "../../utils";
import { Checkbox } from "../../primitives/Checkbox";
import { Dropdown } from "../Dropdown";
import {
  SearchFilter,
  type SearchFilterChip,
  type SearchFilterItem,
} from "../SearchFilter";
import { CustomRangeFields } from "../SearchFilter/CustomRangeFields";
import { DataTableBulkActions } from "./DataTableBulkActions";
import { DataTableColumnsMenu } from "./DataTableColumnsMenu";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableColumnResizer } from "./DataTableColumnResizer";
import { DataTableBody } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableLoading } from "./DataTableLoading";
import { defaultDatePresetOptions } from "./dateFilterOptions";
import {
  getColumnWidthStyle,
  estimateDataColumnSizing,
  normalizeSizingToWidth,
  type SizingColumnSpec,
} from "./column-width";
import { useDebounce } from "../../hooks/useDebounce";
import { CONTROL_PANEL_HEIGHT, NAVBAR_HEIGHT } from "../../layout/stickyOffsets";
import type {
  DataTableBulkAction,
  DataTableFilter,
  DataTableFilterOption,
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

type PanelFilterItem = SearchFilterItem & {
  selectable?: boolean;
  defaultExpanded?: boolean;
  children?: PanelFilterItem[];
  extra?: ReactNode;
};

function readRowDateIso(row: Record<string, unknown>, field: string): string {
  const raw = row[field];
  if (raw == null) return "";
  if (typeof raw === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return toISODate(parsed);
    return "";
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return toISODate(raw);
  return "";
}

function findGroupingOption(
  options: DataTableGroupingOption[],
  value: string
): DataTableGroupingOption | undefined {
  for (const option of options) {
    if (option.value === value) return option;
    if (option.children?.length) {
      const found = findGroupingOption(option.children, value);
      if (found) return found;
    }
  }
  return undefined;
}

function collectPeriodColumnIds(
  options: DataTableGroupingOption[]
): { id: string; grain: PeriodGrain; dateField: string; label: string }[] {
  const out: { id: string; grain: PeriodGrain; dateField: string; label: string }[] = [];
  options.forEach((option) => {
    if (option.children?.length) {
      option.children.forEach((child) => {
        const parsed = parsePeriodGroupingColumnId(child.value);
        if (parsed) {
          out.push({
            id: child.value,
            grain: parsed.grain,
            dateField: option.dateField ?? parsed.dateField,
            label: child.label,
          });
        }
      });
    }
    const self = parsePeriodGroupingColumnId(option.value);
    if (self) {
      out.push({
        id: option.value,
        grain: self.grain,
        dateField: option.dateField ?? self.dateField,
        label: option.label,
      });
    }
  });
  return out;
}

function toggleToken(selected: string[], token: string, on: boolean): string[] {
  if (on) {
    return selected.includes(token) ? selected : [...selected, token];
  }
  return selected.filter((entry) => entry !== token);
}

function buildFilterOptionItems(
  filter: DataTableFilter,
  options: DataTableFilterOption[],
  selected: string[],
  onChange: (next: string[]) => void,
  dividerBeforeFirst: boolean
): PanelFilterItem[] {
  return options.map((option, optionIndex) => {
    const hasChildren = Boolean(option.children?.length);
    const isCustom = Boolean(option.customRange);
    const customToken = selected.find(isCustomRangeValue);
    const customRange = customToken ? parseCustomRange(customToken) : null;
    const isChecked = isCustom ? Boolean(customToken) : selected.includes(option.value);

    const expandOnly =
      !isCustom &&
      (option.selectable === false || (hasChildren && option.selectable !== true));

    return {
      id: `${filter.key}:${option.value}`,
      label: option.label,
      checked: expandOnly ? false : isChecked,
      selectable: !expandOnly,
      dividerBefore: dividerBeforeFirst && optionIndex === 0,
      defaultExpanded: hasChildren || (isCustom && isChecked),
      onSelect: expandOnly
        ? undefined
        : () => {
            if (isCustom) {
              if (isChecked) {
                onChange(selected.filter((entry) => !isCustomRangeValue(entry)));
                return;
              }
              const today = toISODate(new Date());
              onChange([
                ...selected.filter((entry) => !isCustomRangeValue(entry)),
                encodeCustomRange(today, today),
              ]);
              return;
            }
            onChange(toggleToken(selected, option.value, !isChecked));
          },
      children: hasChildren
        ? buildFilterOptionItems(filter, option.children!, selected, onChange, false)
        : undefined,
      extra:
        isCustom && isChecked ? (
          <CustomRangeFields
            from={customRange?.from ?? ""}
            to={customRange?.to ?? ""}
            onChange={({ from, to }) => {
              if (!from || !to) return;
              onChange([
                ...selected.filter((entry) => !isCustomRangeValue(entry)),
                encodeCustomRange(from, to),
              ]);
            }}
          />
        ) : undefined,
    };
  });
}

function buildGroupOptionItems(
  options: DataTableGroupingOption[],
  grouping: string[],
  setGrouping: (next: string[] | ((prev: string[]) => string[])) => void,
  dividerBeforeFirst = false
): PanelFilterItem[] {
  return options.map((option, index) => {
    const hasChildren = Boolean(option.children?.length);
    const childIds = option.children?.map((child) => child.value) ?? [];
    const anyChildActive = childIds.some((id) => grouping.includes(id));
    const isActive = grouping.includes(option.value);

    const isAggregatingParent =
      hasChildren && (Boolean(option.dateField) || option.selectable === true);

    if (isAggregatingParent) {
      return {
        id: option.value,
        label: option.label,
        checked: anyChildActive,
        active: anyChildActive,
        selectable: true,
        dividerBefore: dividerBeforeFirst && index === 0,
        defaultExpanded: option.defaultExpanded ?? true,
        onSelect: () =>
          setGrouping((prev) => prev.filter((id) => !childIds.includes(id))),
        children: buildGroupOptionItems(option.children!, grouping, setGrouping),
      };
    }

    const expandOnly =
      option.selectable === false || (hasChildren && option.selectable !== true);

    return {
      id: option.value,
      label: option.label,
      checked: expandOnly ? false : isActive,
      active: expandOnly ? false : isActive,
      selectable: !expandOnly,
      dividerBefore: dividerBeforeFirst && index === 0,
      defaultExpanded: option.defaultExpanded ?? hasChildren,
      onSelect: expandOnly
        ? undefined
        : () =>
            setGrouping((prev) =>
              prev.includes(option.value)
                ? prev.filter((id) => id !== option.value)
                : [...prev, option.value]
            ),
      children: hasChildren
        ? buildGroupOptionItems(option.children!, grouping, setGrouping)
        : undefined,
    };
  });
}

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
  /** Optional per-row `<tr>` classes (e.g. status text color on all cells). */
  getRowClassName?: (row: TData) => string | undefined;
  /**
   * Keep column headers pinned while the page scrolls. Defaults to true.
   * Sticks under the Navbar, and under ControlPanel when `belowControlPanel`
   * is true (or when `renderToolbar` is used).
   */
  stickyHeader?: boolean;
  /**
   * When a sticky `ControlPanel` sits above the table, offset the sticky
   * header below it. Defaults to true whenever `renderToolbar` is provided.
   */
  belowControlPanel?: boolean;
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
  getRowClassName,
  stickyHeader = true,
  belowControlPanel,
  renderToolbar,
}: DataTableProps<TData, TValue>) {
  const isServerPagination = typeof pagination === "object";
  const enablePagination = pagination !== false;
  const resolvedBelowControlPanel = belowControlPanel ?? renderToolbar != null;
  const stickyHeaderTop = stickyHeader
    ? NAVBAR_HEIGHT + (resolvedBelowControlPanel ? CONTROL_PANEL_HEIGHT : 0)
    : undefined;

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
    const node = scrollRef.current;
    if (!node) return;

    // Header row real height for resize handles. Zoom-correct so inline `px`
    // heights are not double-scaled by browser zoom.
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
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      visualViewport?.removeEventListener("resize", measure);
    };
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

  useEffect(() => {
    if (!enableGrouping || groupingOptions.length === 0) return;
    const periodIds = collectPeriodColumnIds(groupingOptions).map((item) => item.id);
    if (periodIds.length === 0) return;
    setColumnVisibility((prev) => {
      let changed = false;
      const next = { ...prev };
      periodIds.forEach((id) => {
        if (next[id] !== false) {
          next[id] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [enableGrouping, groupingOptions]);

  const sorting = controlledSorting?.state ?? internalSorting;
  const setSorting = controlledSorting?.onChange ?? setInternalSorting;
  const filterValues = controlledFiltering?.state ?? internalFilters;
  const setFilterValues = controlledFiltering?.onChange ?? setInternalFilters;

  const tableColumns = useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = [...columns];

    if (enableGrouping && groupingOptions.length > 0) {
      const periodCols = collectPeriodColumnIds(groupingOptions);
      periodCols.forEach((period) => {
        if (cols.some((column) => column.id === period.id)) return;
        cols.push({
          id: period.id,
          header: period.label,
          accessorFn: (row) => {
            const iso = readRowDateIso(row as Record<string, unknown>, period.dateField);
            return iso ? bucketDate(iso, period.grain) : "Unspecified";
          },
          enableHiding: false,
          enableSorting: false,
          meta: { fill: false },
        } as ColumnDef<TData, TValue>);
      });
    }

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
      if (parsePeriodGroupingColumnId(column.id ?? "")) {
        return {
          ...column,
          enableResizing: false,
          enableHiding: false,
          enableSorting: false,
          size: column.size ?? 1,
          minSize: 0,
          maxSize: 1,
        };
      }
      return {
        ...column,
        minSize: column.minSize ?? DEFAULT_COLUMN_MIN_SIZE,
        maxSize: column.maxSize ?? DEFAULT_COLUMN_MAX_SIZE,
      };
    });
  }, [columns, selectable, getRowActions, activeRowId, enableGrouping, groupingOptions]);

  const filteredBySearch = useMemo(() => {
    let rows = data;

    if (!manualFiltering) {
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
        if (filter.type === "date-presets") return;
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
    }

    filters.forEach((filter) => {
      if (filter.type !== "date-presets") return;
      const raw = filterValues[filter.key];
      const selected = Array.isArray(raw)
        ? raw
        : typeof raw === "string" && raw
          ? [raw]
          : [];
      if (selected.length === 0) return;
      const field = filter.dateField ?? filter.key;
      rows = rows.filter((row) =>
        dateMatchesFilterTokens(
          readRowDateIso(row as Record<string, unknown>, field),
          selected
        )
      );
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

  // Content-based first sizing once rows exist. Must re-normalize to the
  // measured container in the same update — otherwise estimate overwrites the
  // fitted widths and table-fixed redistributes the sum drift (text appears to
  // spill into the next column until a manual resize forces normalize again).
  useEffect(() => {
    if (sizingLockedRef.current) return;
    if (loading) return;
    if (data.length === 0) return;

    const estimated = estimateDataColumnSizing(
      columns as ColumnDef<TData, unknown>[],
      data,
      {
        minSize: DEFAULT_COLUMN_MIN_SIZE,
        maxSize: DEFAULT_COLUMN_MAX_SIZE,
      }
    );
    sizingLockedRef.current = true;

    if (containerWidth <= 0) {
      setColumnSizing(estimated);
      return;
    }

    const leafs = table.getVisibleLeafColumns();
    if (leafs.length === 0) {
      setColumnSizing(estimated);
      return;
    }

    const specs: SizingColumnSpec[] = leafs.map((column) => ({
      id: column.id,
      minSize: column.columnDef.minSize ?? DEFAULT_COLUMN_MIN_SIZE,
      maxSize: column.columnDef.maxSize ?? DEFAULT_COLUMN_MAX_SIZE,
      size: estimated[column.id] ?? column.getSize(),
      fill: Boolean(column.columnDef.meta?.fill),
      fixed:
        column.id === "__select" ||
        column.id === "__actions" ||
        column.columnDef.enableResizing === false,
    }));

    setColumnSizing(normalizeSizingToWidth(estimated, specs, containerWidth));
    // table / columns read for leaf defs + content estimate; lock after first fit
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after first non-empty load
  }, [loading, data, columns, containerWidth, visibleLeafKey]);

  const resolvedGroupingOptions = useMemo((): DataTableGroupingOption[] => {
    if (!enableGrouping) return [];
    if (groupingOptions.length > 0) return groupingOptions;
    // Dimensions = table columns (not filter option values)
    return table
      .getAllLeafColumns()
      .filter(
        (column) =>
          column.id !== "__select" &&
          column.id !== "__actions" &&
          !parsePeriodGroupingColumnId(column.id)
      )
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

  const orderedGrouping = useMemo(() => {
    if (grouping.length <= 1) return grouping;
    const periodIds = grouping.filter((id) => parsePeriodGroupingColumnId(id));
    const otherIds = grouping.filter((id) => !parsePeriodGroupingColumnId(id));
    if (periodIds.length === 0) return grouping;
    const grains = sortPeriodGrains(
      periodIds
        .map((id) => parsePeriodGroupingColumnId(id)?.grain)
        .filter((grain): grain is PeriodGrain => Boolean(grain))
    );
    const sortedPeriodIds = grains.map((grain) => {
      const match = periodIds.find(
        (id) => parsePeriodGroupingColumnId(id)?.grain === grain
      );
      return match!;
    });
    return [...otherIds, ...sortedPeriodIds];
  }, [grouping]);

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

    if (filter.type === "date-presets") {
      searchFilterChips.push({
        id: filter.key,
        label: filter.label,
        prefix: filter.label,
        values: selected.map(labelForDateFilterToken),
        separator: "/",
        kind: "filter",
        onRemove: () => handleFilterChange(filter.key, []),
      } as SearchFilterChip);
      return;
    }

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
    const labels: string[] = [];
    const consumed = new Set<string>();

    resolvedGroupingOptions.forEach((option) => {
      if (!option.children?.length) return;
      const selectedChildren = option.children.filter((child) =>
        grouping.includes(child.value)
      );
      if (selectedChildren.length === 0) return;
      const grainOrder = sortPeriodGrains(
        selectedChildren
          .map((child) => parsePeriodGroupingColumnId(child.value)?.grain)
          .filter((grain): grain is PeriodGrain => Boolean(grain))
      );
      const sortedChildren = [...selectedChildren].sort((a, b) => {
        const ga = parsePeriodGroupingColumnId(a.value)?.grain;
        const gb = parsePeriodGroupingColumnId(b.value)?.grain;
        if (!ga || !gb) return 0;
        return grainOrder.indexOf(ga) - grainOrder.indexOf(gb);
      });
      labels.push(option.label, ...sortedChildren.map((child) => child.label));
      sortedChildren.forEach((child) => consumed.add(child.value));
    });

    grouping.forEach((groupId) => {
      if (consumed.has(groupId)) return;
      const found = findGroupingOption(resolvedGroupingOptions, groupId);
      labels.push(found?.label ?? groupId);
    });

    searchFilterChips.push({
      id: "group",
      label: labels[0] ?? "Group",
      values: labels,
      kind: "group",
      onRemove: () => setGrouping([]),
    });
  }

  const panelFilterItems: PanelFilterItem[] = [];
  filters.forEach((filter, filterIndex) => {
    if (filter.type === "date-presets") {
      const raw = filterValues[filter.key];
      const selected = Array.isArray(raw)
        ? raw
        : typeof raw === "string" && raw
          ? [raw]
          : [];
      const options = filter.options?.length
        ? filter.options
        : defaultDatePresetOptions();
      panelFilterItems.push({
        id: filter.key,
        label: filter.label,
        checked: selected.length > 0,
        selectable: true,
        defaultExpanded: true,
        dividerBefore: filterIndex > 0,
        onSelect: () => handleFilterChange(filter.key, []),
        children: buildFilterOptionItems(
          filter,
          options,
          selected,
          (next) => handleFilterChange(filter.key, next),
          false
        ),
      });
      return;
    }

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
      const options = filter.options ?? [];
      if (options.some((option) => option.children?.length)) {
        panelFilterItems.push({
          id: filter.key,
          label: filter.label,
          selectable: false,
          defaultExpanded: true,
          dividerBefore: filterIndex > 0,
          children: buildFilterOptionItems(
            filter,
            options,
            selected,
            (next) => handleFilterChange(filter.key, next),
            false
          ),
        });
        return;
      }
      options.forEach((option, optionIndex) => {
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

  const panelGroupItems: PanelFilterItem[] = buildGroupOptionItems(
    resolvedGroupingOptions,
    grouping,
    setGrouping
  );

  const showSearchFilter =
    searchable || filters.length > 0 || resolvedGroupingOptions.length > 0;
  const hasSelection = selectedRows.length > 0;

  const totalColumnsWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, column) => sum + column.getSize(), 0);
  // Fill the host container. Column sizes are kept summing to `containerWidth`
  // via `normalizeSizingToWidth` (at rest + after resize), so header and body
  // share one full-width grid.
  const tableWidth = containerWidth > 0 ? containerWidth : totalColumnsWidth;

  const pager = enablePagination ? (
    <DataTablePagination
      table={table}
      totalRows={totalRows}
      serverMode={isServerPagination}
    />
  ) : null;

  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && !parsePeriodGroupingColumnId(column.id));
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
      filters={panelFilterItems as SearchFilterItem[]}
      groupBy={panelGroupItems as SearchFilterItem[]}
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
          />
        ) : (
          <div className="relative w-full">
            <div ref={scrollRef} className="relative w-full">
              <DataTableColumnResizer
                table={table}
                enabled={enableColumnResizing}
                columnSizing={columnSizing}
                onColumnSizingChange={(next) => {
                  sizingLockedRef.current = true;
                  // Always keep column widths summing to the container so the
                  // table stays full-width (header + body share one grid).
                  if (containerWidth > 0) {
                    const leafs = table.getVisibleLeafColumns();
                    const sum = leafs.reduce(
                      (total, column) => total + (next[column.id] ?? column.getSize()),
                      0
                    );
                    if (sum !== containerWidth) {
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
                headerHeight={headerHeight}
                stickyTop={stickyHeaderTop}
              />
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
                  stickyTop={stickyHeaderTop}
                />
                <DataTableBody
                  table={table}
                  emptyMessage={emptyMessage}
                  groupingColumnIds={orderedGrouping}
                  activeRowId={activeRowId}
                  onClearActiveRow={() => setActiveRowId(null)}
                  getRowClassName={getRowClassName}
                />
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
