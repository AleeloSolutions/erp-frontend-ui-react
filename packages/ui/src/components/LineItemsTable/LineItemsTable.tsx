import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "../../utils";
import {
  DataTableColumnsMenu,
  startNeighborColumnResize,
  type DataTableColumnsMenuItem,
} from "../DataTable";

export interface LineItemsRowHelpers<T> {
  /** Local, uncommitted patch — call on every keystroke/change. */
  onChange: (patch: Partial<T>) => void;
  /** "Save on key leave" — call from a field's onBlur (or Enter). */
  onCommit: () => void;
}

export interface LineItemsColumn<T> {
  key: string;
  label: string;
  align?: "start" | "end";
  /** Initial width in px — also the seed for resizing. Defaults to 140. */
  size?: number;
  minSize?: number;
  maxSize?: number;
  /** Set false to keep this column always visible (omits it from the columns menu). Defaults to true. */
  hideable?: boolean;
  className?: string;
  renderCell: (row: T, helpers: LineItemsRowHelpers<T>) => ReactNode;
}

export interface LineItemsFooterAction {
  key: string;
  label: string;
  onClick: () => void;
}

export interface LineItemsSpecialRow {
  content: ReactNode;
  /** Cells rendered normally after the merged span, e.g. a section's subtotal. */
  trailingCells?: ReactNode[];
}

export interface LineItemsTableProps<T extends { id: string }> {
  columns: LineItemsColumn<T>[];
  rows: T[];
  /** Controlled rows — called on every local edit (rule: consumer owns state). */
  onRowsChange: (rows: T[]) => void;
  /** Fired when a field commits (blur/Enter) with the row's current data — "save on key leave". */
  onCommitRow?: (row: T) => void;
  /** Builds a new row with the same shape as the design when "Add a line" is clicked. */
  createEmptyRow: () => T;
  onAddLine?: (row: T) => void;
  onRemoveRow?: (id: string) => void;
  addLineLabel?: string;
  /** Extra footer text-links, e.g. "Add a section" / "Add a note" / "Catalog". */
  secondaryFooterActions?: LineItemsFooterAction[];
  /** Opt a row out of normal per-column rendering (e.g. a section/note row that merges columns). */
  getSpecialRow?: (
    row: T,
    helpers: LineItemsRowHelpers<T>
  ) => LineItemsSpecialRow | undefined;
  /**
   * Stable id for this table instance. When set, column widths persist under
   * `erp.lineitemstable.sizing.${tableId}` and column visibility under
   * `erp.lineitemstable.visibility.${tableId}` (same convention as DataTable).
   */
  tableId?: string;
  /** Defaults to true. */
  enableColumnResizing?: boolean;
  /** Defaults to true. */
  enableColumnVisibility?: boolean;
  className?: string;
  "aria-label"?: string;
}

const footerLinkClass = "text-base font-[400] text-erp-brand-third";
const SIZING_STORAGE_PREFIX = "erp.lineitemstable.sizing.";
const VISIBILITY_STORAGE_PREFIX = "erp.lineitemstable.visibility.";
const DEFAULT_MIN_SIZE = 60;
const DEFAULT_MAX_SIZE = 480;
const DEFAULT_SIZE = 140;

function readStoredSizing(tableId: string | undefined): Record<string, number> {
  if (!tableId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${SIZING_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function readStoredVisibility(tableId: string | undefined): Record<string, boolean> {
  if (!tableId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${VISIBILITY_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "boolean") next[key] = value;
    }
    return next;
  } catch {
    return {};
  }
}

/**
 * Odoo-style editable o2m line-items grid (e.g. invoice/order lines):
 * drag handle + pluggable columns + delete icon, with an "Add a line" row
 * that appends a row built from `createEmptyRow` (same shape/renderers as
 * every other row, so it's visually identical by construction) and a
 * commit-on-blur lifecycle for inline field edits. Column resizing and
 * show/hide reuse the same mechanics as DataTable (`column-width.ts`,
 * `DataTableColumnsMenu`) rather than duplicating them.
 */
export function LineItemsTable<T extends { id: string }>({
  columns,
  rows,
  onRowsChange,
  onCommitRow,
  createEmptyRow,
  onAddLine,
  onRemoveRow,
  addLineLabel = "Add a line",
  secondaryFooterActions = [],
  getSpecialRow,
  tableId,
  enableColumnResizing = true,
  enableColumnVisibility = true,
  className,
  "aria-label": ariaLabel = "Line items",
}: LineItemsTableProps<T>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() =>
    readStoredSizing(tableId)
  );
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    readStoredVisibility(tableId)
  );
  const [resizeDirection, setResizeDirection] = useState<"ltr" | "rtl">("ltr");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readDirection = () => {
      const hostedDir =
        rootRef.current?.closest("[dir]")?.getAttribute("dir") ??
        document.documentElement.getAttribute("dir") ??
        "ltr";
      setResizeDirection(hostedDir === "rtl" ? "rtl" : "ltr");
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
    if (!tableId || typeof window === "undefined") return;
    if (Object.keys(columnSizing).length === 0) return;
    window.localStorage.setItem(
      `${SIZING_STORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnSizing)
    );
  }, [tableId, columnSizing]);

  useEffect(() => {
    if (!tableId || !enableColumnVisibility || typeof window === "undefined") return;
    window.localStorage.setItem(
      `${VISIBILITY_STORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnVisibility)
    );
  }, [tableId, enableColumnVisibility, columnVisibility]);

  const visibleColumns = enableColumnVisibility
    ? columns.filter((column) => columnVisibility[column.key] !== false)
    : columns;

  const getSize = (column: LineItemsColumn<T>) =>
    columnSizing[column.key] ?? column.size ?? DEFAULT_SIZE;

  const patchRow = (id: string, patch: Partial<T>) => {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const commitRow = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (row) onCommitRow?.(row);
  };

  const handleAddLine = () => {
    const row = createEmptyRow();
    onRowsChange([...rows, row]);
    onAddLine?.(row);
  };

  const handleRemove = (id: string) => {
    onRowsChange(rows.filter((row) => row.id !== id));
    onRemoveRow?.(id);
  };

  const handleDragStart = (event: DragEvent<HTMLSpanElement>, id: string) => {
    setDragId(id);
    event.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set for the drag to start at all.
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (event: DragEvent<HTMLTableRowElement>, id: string) => {
    if (!dragId || dragId === id) return;
    event.preventDefault();
    if (overId !== id) setOverId(id);
  };

  const handleDrop = (event: DragEvent<HTMLTableRowElement>, targetId: string) => {
    event.preventDefault();
    setOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIndex = rows.findIndex((row) => row.id === dragId);
    const toIndex = rows.findIndex((row) => row.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onRowsChange(next);
    setDragId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  const startResize = (
    event: ReactPointerEvent<HTMLSpanElement>,
    column: LineItemsColumn<T>,
    neighbor: LineItemsColumn<T>
  ) => {
    startNeighborColumnResize({
      event,
      columnId: column.key,
      neighborId: neighbor.key,
      startSizing: {
        ...columnSizing,
        [column.key]: getSize(column),
        [neighbor.key]: getSize(neighbor),
      },
      columnMin: column.minSize ?? DEFAULT_MIN_SIZE,
      columnMax: column.maxSize ?? DEFAULT_MAX_SIZE,
      neighborMin: neighbor.minSize ?? DEFAULT_MIN_SIZE,
      neighborMax: neighbor.maxSize ?? DEFAULT_MAX_SIZE,
      direction: resizeDirection,
      onChange: setColumnSizing,
    });
  };

  const columnsMenuItems: DataTableColumnsMenuItem[] = (() => {
    if (!enableColumnVisibility) return [];
    const hideable = columns.filter((column) => column.hideable !== false);
    const visibleHideableCount = hideable.filter(
      (column) => columnVisibility[column.key] !== false
    ).length;
    return hideable.map((column) => {
      const isVisible = columnVisibility[column.key] !== false;
      return {
        id: column.key,
        label: column.label,
        isVisible,
        isDisabled: isVisible && visibleHideableCount <= 1,
        onToggle: () =>
          setColumnVisibility((prev) => ({ ...prev, [column.key]: !isVisible })),
      };
    });
  })();

  return (
    <div
      ref={rootRef}
      className={cn("overflow-x-auto [scrollbar-width:thin]", className)}
    >
      <table
        aria-label={ariaLabel}
        className="mb-0 w-full table-fixed border-collapse text-base"
      >
        <colgroup>
          <col style={{ width: 32 }} />
          {visibleColumns.map((column) => (
            <col key={column.key} style={{ width: getSize(column) }} />
          ))}
          <col style={{ width: 32 }} />
        </colgroup>
        <thead>
          <tr className="border-b border-erp-border">
            <th className="w-8" />
            {visibleColumns.map((column, index) => {
              const hasNext = index < visibleColumns.length - 1;
              const neighbor = hasNext
                ? visibleColumns[index + 1]
                : visibleColumns[index - 1];
              // With a next column, the handle sits on this column's trailing edge and
              // grows it into that neighbor. The last column has no next column, so its
              // handle sits on the leading edge instead, resizing against the previous one.
              const handleOnEndEdge = hasNext;
              return (
                <th
                  key={column.key}
                  className={cn(
                    "relative px-2 py-2 text-base font-semibold text-erp-form-label",
                    column.align === "end" ? "text-end" : "text-start",
                    column.className
                  )}
                >
                  {column.label}
                  {enableColumnResizing && neighbor ? (
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-hidden
                      onPointerDown={(event) => {
                        if (!event.isPrimary) return;
                        event.preventDefault();
                        event.stopPropagation();
                        startResize(event, column, neighbor);
                      }}
                      className={cn(
                        "absolute inset-y-0 z-10 w-1.5 cursor-col-resize touch-none select-none bg-erp-text/25 opacity-0 hover:opacity-50",
                        handleOnEndEdge ? "end-0" : "start-0"
                      )}
                    />
                  ) : null}
                </th>
              );
            })}
            <th className="w-8 p-0">
              {columnsMenuItems.length > 0 ? (
                <div className="flex justify-center">
                  <DataTableColumnsMenu items={columnsMenuItems} />
                </div>
              ) : null}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const helpers: LineItemsRowHelpers<T> = {
              onChange: (patch) => patchRow(row.id, patch),
              onCommit: () => commitRow(row.id),
            };
            const special = getSpecialRow?.(row, helpers);
            const span = special
              ? visibleColumns.length - (special.trailingCells?.length ?? 0)
              : 0;

            return (
              <tr
                key={row.id}
                onDragOver={(event) => handleDragOver(event, row.id)}
                onDrop={(event) => handleDrop(event, row.id)}
                className={cn(
                  "group border-b border-erp-border hover:bg-erp-surface-hover focus-within:bg-erp-surface-muted",
                  dragId === row.id && "opacity-50",
                  overId === row.id &&
                    dragId !== row.id &&
                    "border-t-2 border-t-erp-primary"
                )}
              >
                <td className="px-1 py-2 align-top text-erp-subtle">
                  <span
                    className="inline-flex cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(event) => handleDragStart(event, row.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </td>
                {special ? (
                  <>
                    <td colSpan={span} className="px-2 py-1 align-top">
                      {special.content}
                    </td>
                    {special.trailingCells?.map((cell, index) => (
                      <td key={index} className="px-2 py-1 text-end align-top">
                        {cell}
                      </td>
                    ))}
                  </>
                ) : (
                  visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-2 py-1 align-top",
                        column.align === "end" ? "text-end" : "text-start"
                      )}
                    >
                      {column.renderCell(row, helpers)}
                    </td>
                  ))
                )}
                <td className="px-1 py-2 align-top text-center">
                  <button
                    type="button"
                    aria-label="Delete row"
                    onClick={() => handleRemove(row.id)}
                    className="text-erp-danger opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={visibleColumns.length + 2} className="p-0">
              <div className="flex flex-wrap items-center gap-4 px-2 py-2">
                <button type="button" onClick={handleAddLine} className={footerLinkClass}>
                  {addLineLabel}
                </button>
                {secondaryFooterActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    className={footerLinkClass}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
