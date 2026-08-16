import type { CSSProperties } from "react";
import type { Column, ColumnDef, ColumnSizingState } from "@tanstack/react-table";
import "../../types/table";

const CHAR_WIDTH_PX = 7.2;
const CELL_X_PADDING_PX = 24;
const HEADER_EXTRA_PX = 28;
const SAMPLE_ROWS = 30;

/** Locked pixel box so a column cannot expand into its neighbor. */
export function getColumnWidthStyle<TData, TValue>(
  column: Column<TData, TValue>
): CSSProperties {
  const size = column.getSize();
  return {
    width: size,
    minWidth: size,
    maxWidth: size,
  };
}

/** Match `<col>` lock on cells/headers; content truncates instead of pushing layout. */
export function getColumnCellStyle<TData, TValue>(
  column: Column<TData, TValue>
): CSSProperties {
  const size = column.getSize();
  return {
    width: size,
    minWidth: size,
    maxWidth: size,
  };
}

export type SizingColumnSpec = {
  id: string;
  minSize: number;
  maxSize: number;
  size?: number;
  fill?: boolean;
  /** Non-flexible utility columns (__select / __actions). */
  fixed?: boolean;
};

function headerLabel<TData, TValue>(column: ColumnDef<TData, TValue>): string {
  if (typeof column.header === "string") return column.header;
  if ("id" in column && column.id) return String(column.id);
  if ("accessorKey" in column && column.accessorKey != null) {
    return String(column.accessorKey);
  }
  return "";
}

function sampleValue<TData>(row: TData, column: ColumnDef<TData, unknown>): string {
  if ("accessorKey" in column && column.accessorKey != null) {
    const key = column.accessorKey as keyof TData & string;
    const value = (row as Record<string, unknown>)[key];
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    return JSON.stringify(value);
  }
  if ("accessorFn" in column && typeof column.accessorFn === "function") {
    try {
      const value = column.accessorFn(row, 0);
      if (value == null) return "";
      return String(value);
    } catch {
      return "";
    }
  }
  return "";
}

/**
 * Content-based initial widths from header + sampled cell values.
 * Skips utility columns; respects minSize/maxSize on each column def.
 */
export function estimateDataColumnSizing<TData>(
  columns: ColumnDef<TData, unknown>[],
  data: TData[],
  options?: {
    minSize?: number;
    maxSize?: number;
  }
): ColumnSizingState {
  const fallbackMin = options?.minSize ?? 72;
  const fallbackMax = options?.maxSize ?? 640;
  const sizing: ColumnSizingState = {};
  const rows = data.slice(0, SAMPLE_ROWS);

  columns.forEach((column, index) => {
    const id =
      column.id ??
      ("accessorKey" in column && column.accessorKey != null
        ? String(column.accessorKey)
        : `col-${index}`);

    if (id === "__select" || id === "__actions") return;
    if (column.enableResizing === false && column.size != null) {
      sizing[id] = column.size;
      return;
    }

    if (column.size != null && !column.meta?.fill) {
      sizing[id] = column.size;
      return;
    }

    const minSize = column.minSize ?? fallbackMin;
    const maxSize = column.maxSize ?? fallbackMax;
    const label = headerLabel(column);
    let maxChars = label.length;

    rows.forEach((row) => {
      maxChars = Math.max(maxChars, sampleValue(row, column).length);
    });

    const fromContent = Math.ceil(
      maxChars * CHAR_WIDTH_PX +
        CELL_X_PADDING_PX +
        (typeof column.header === "string" ? HEADER_EXTRA_PX : CELL_X_PADDING_PX)
    );

    const fillBoost = column.meta?.fill ? 48 : 0;
    sizing[id] = Math.min(maxSize, Math.max(minSize, fromContent + fillBoost));
  });

  return sizing;
}

/**
 * Scale/redistribute flexible column sizes so they sum to `targetWidth`
 * (fixed utility columns keep their sizes). Prefer `meta.fill` for remainder.
 */
export function normalizeSizingToWidth(
  sizing: ColumnSizingState,
  columns: SizingColumnSpec[],
  targetWidth: number
): ColumnSizingState {
  if (targetWidth <= 0 || columns.length === 0) return sizing;

  const next: ColumnSizingState = { ...sizing };
  let fixedSum = 0;
  const flexible: SizingColumnSpec[] = [];

  for (const col of columns) {
    const current = next[col.id] ?? col.size ?? col.minSize;
    const clamped = Math.min(col.maxSize, Math.max(col.minSize, current));
    next[col.id] = clamped;
    if (col.fixed || col.minSize === col.maxSize) {
      fixedSum += clamped;
    } else {
      flexible.push(col);
    }
  }

  if (flexible.length === 0) return next;

  const available = Math.max(
    flexible.reduce((sum, col) => sum + col.minSize, 0),
    targetWidth - fixedSum
  );

  let flexSum = flexible.reduce((sum, col) => sum + (next[col.id] ?? col.minSize), 0);
  if (flexSum <= 0) {
    const each = Math.floor(available / flexible.length);
    let used = 0;
    flexible.forEach((col, index) => {
      if (index === flexible.length - 1) {
        next[col.id] = Math.min(col.maxSize, Math.max(col.minSize, available - used));
      } else {
        const size = Math.min(col.maxSize, Math.max(col.minSize, each));
        next[col.id] = size;
        used += size;
      }
    });
    return next;
  }

  const scale = available / flexSum;
  flexible.forEach((col, index) => {
    if (index === flexible.length - 1) return;
    const size = Math.min(
      col.maxSize,
      Math.max(col.minSize, Math.round((next[col.id] ?? col.minSize) * scale))
    );
    next[col.id] = size;
  });

  const fillCol = flexible.find((col) => col.fill) ?? flexible[flexible.length - 1];
  const othersUsed = flexible
    .filter((col) => col.id !== fillCol.id)
    .reduce((sum, col) => sum + (next[col.id] ?? col.minSize), 0);
  next[fillCol.id] = Math.min(
    fillCol.maxSize,
    Math.max(fillCol.minSize, available - othersUsed)
  );

  // If fill hit a clamp, nudge other flexible columns slightly
  let finalFlex = flexible.reduce((sum, col) => sum + (next[col.id] ?? 0), 0);
  let drift = available - finalFlex;
  if (drift !== 0) {
    for (const col of flexible) {
      if (drift === 0) break;
      if (col.id === fillCol.id) continue;
      const current = next[col.id] ?? col.minSize;
      const adjusted = Math.min(col.maxSize, Math.max(col.minSize, current + drift));
      const applied = adjusted - current;
      next[col.id] = adjusted;
      drift -= applied;
    }
    if (drift !== 0) {
      const current = next[fillCol.id] ?? fillCol.minSize;
      next[fillCol.id] = Math.min(
        fillCol.maxSize,
        Math.max(fillCol.minSize, current + drift)
      );
    }
  }

  return next;
}

/** Excel-style: grow/shrink `columnId` and give/take from `neighborId`. */
export function applyNeighborResize(
  sizing: ColumnSizingState,
  columnId: string,
  neighborId: string,
  delta: number,
  limits: {
    columnMin: number;
    columnMax: number;
    neighborMin: number;
    neighborMax: number;
  }
): ColumnSizingState {
  const startA = sizing[columnId] ?? limits.columnMin;
  const startB = sizing[neighborId] ?? limits.neighborMin;

  let nextA = startA + delta;
  let nextB = startB - delta;

  if (nextA < limits.columnMin) {
    nextB -= limits.columnMin - nextA;
    nextA = limits.columnMin;
  } else if (nextA > limits.columnMax) {
    nextB += nextA - limits.columnMax;
    nextA = limits.columnMax;
  }

  if (nextB < limits.neighborMin) {
    nextA -= limits.neighborMin - nextB;
    nextB = limits.neighborMin;
  } else if (nextB > limits.neighborMax) {
    nextA += nextB - limits.neighborMax;
    nextB = limits.neighborMax;
  }

  nextA = Math.min(limits.columnMax, Math.max(limits.columnMin, nextA));
  nextB = Math.min(limits.neighborMax, Math.max(limits.neighborMin, nextB));

  return {
    ...sizing,
    [columnId]: Math.round(nextA),
    [neighborId]: Math.round(nextB),
  };
}

/**
 * Pointer drag that resizes a column against its neighbor while keeping total width.
 * Returns a cleanup function.
 */
export function startNeighborColumnResize(options: {
  startClientX: number;
  columnId: string;
  neighborId: string;
  startSizing: ColumnSizingState;
  columnMin: number;
  columnMax: number;
  neighborMin: number;
  neighborMax: number;
  /** LTR: positive dx grows the column. RTL: inverted. */
  direction: "ltr" | "rtl";
  onChange: (sizing: ColumnSizingState) => void;
  onEnd?: () => void;
}): () => void {
  const {
    startClientX,
    columnId,
    neighborId,
    startSizing,
    columnMin,
    columnMax,
    neighborMin,
    neighborMax,
    direction,
    onChange,
    onEnd,
  } = options;

  function onMove(event: MouseEvent | TouchEvent) {
    const clientX =
      "touches" in event ? (event.touches[0]?.clientX ?? startClientX) : event.clientX;
    const rawDelta = clientX - startClientX;
    const delta = direction === "rtl" ? -rawDelta : rawDelta;
    onChange(
      applyNeighborResize(startSizing, columnId, neighborId, delta, {
        columnMin,
        columnMax,
        neighborMin,
        neighborMax,
      })
    );
  }

  function onUp() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onUp);
    onEnd?.();
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onUp);

  return onUp;
}
