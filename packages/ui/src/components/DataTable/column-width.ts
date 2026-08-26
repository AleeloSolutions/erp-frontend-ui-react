import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { Column, ColumnDef, ColumnSizingState } from "@tanstack/react-table";
import "../../types/table";

const CHAR_WIDTH_PX = 7.2;
const CELL_X_PADDING_PX = 24;
const HEADER_EXTRA_PX = 28;
const SAMPLE_ROWS = 30;

/** Below this rendered width, cells switch to compact horizontal padding. */
const COMPACT_PADDING_THRESHOLD_PX = 80;
const COMPACT_PADDING_X_PX = 8;
const DEFAULT_PADDING_X_PX = 16;

function paddingXFor(size: number): number {
  return size < COMPACT_PADDING_THRESHOLD_PX
    ? COMPACT_PADDING_X_PX
    : DEFAULT_PADDING_X_PX;
}

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

/**
 * Cell/header chrome only — **not** column width.
 *
 * Widths are owned exclusively by `<colgroup>` via `getColumnWidthStyle` so the
 * header and body cannot disagree. Setting width on both `<col>` and `<th>`/`<td>`
 * lets fixed-layout tables redistribute a 1px sum drift differently against the
 * first row vs the body, which shows up as header/body boundary drift while
 * resizing. Horizontal padding still shrinks on narrow columns so truncated
 * text/icons keep a usable content box (checkbox/actions stay `p-0`).
 */
export function getColumnCellStyle<TData, TValue>(
  column: Column<TData, TValue>
): CSSProperties {
  if (column.id === "__select" || column.id === "__actions") return {};
  const paddingX = paddingXFor(column.getSize());
  return {
    paddingInlineStart: paddingX,
    paddingInlineEnd: paddingX,
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

  const flexSum = flexible.reduce((sum, col) => sum + (next[col.id] ?? col.minSize), 0);
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
  const finalFlex = flexible.reduce((sum, col) => sum + (next[col.id] ?? 0), 0);
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
  const intended = Math.round(delta);

  let nextA = startA + intended;
  let nextB = startB - intended;

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

  // Keep pair sum exact — never independently re-round A and B.
  return {
    ...sizing,
    [columnId]: nextA,
    [neighborId]: nextB,
  };
}

/**
 * At most one column-resize drag's listeners may be active at a time. If a
 * previous drag's `pointerup`/`pointercancel` never reached us for any reason,
 * starting a new drag force-cleans it up first — otherwise its stale listener
 * keeps recomputing sizing off its own (unrelated) start point on every
 * pointermove, fighting the new drag and corrupting both.
 */
let activeDragCleanup: (() => void) | null = null;

/**
 * Drives a column-resize drag off Pointer Capture rather than `window`
 * mouse/touch listeners. With `window` listeners, a drag whose `pointerup`
 * fires outside the page (over a devtools panel, an iframe, or after the
 * cursor leaves the viewport during a fast drag) can fail to get cleaned up —
 * the stale `mousemove` listener keeps firing on every future mouse movement,
 * including during later, unrelated drags, corrupting their sizing. Pointer
 * capture binds subsequent pointer events to the target element for the
 * duration of the gesture regardless of where the pointer physically is, so
 * `pointerup`/`pointercancel` are far more likely to reach us and tear the
 * drag down — and `activeDragCleanup` above is the unconditional backstop for
 * the rest.
 */
function startPointerColumnDrag(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (clientX: number) => void,
  onEnd?: () => void
): void {
  // Force-end whatever drag (if any) never got its own pointerup/pointercancel,
  // including its onEnd — so a stale "active" highlight can't linger either.
  activeDragCleanup?.();

  const target = event.currentTarget;
  const pointerId = event.pointerId;
  const prevUserSelect = document.body.style.userSelect;
  const prevCursor = document.body.style.cursor;
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";

  function handleMove(nativeEvent: PointerEvent) {
    if (nativeEvent.pointerId !== pointerId) return;
    // Prevent the browser selecting header/body text mid-drag (blue selection
    // reads as the header "shifting" independently of the body).
    nativeEvent.preventDefault();
    onMove(nativeEvent.clientX);
  }

  function forceEnd() {
    if (activeDragCleanup === forceEnd) activeDragCleanup = null;
    document.body.style.userSelect = prevUserSelect;
    document.body.style.cursor = prevCursor;
    target.removeEventListener("pointermove", handleMove);
    target.removeEventListener("pointerup", handleEnd);
    target.removeEventListener("pointercancel", handleEnd);
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    onEnd?.();
  }

  function handleEnd(nativeEvent: PointerEvent) {
    if (nativeEvent.pointerId !== pointerId) return;
    forceEnd();
  }

  activeDragCleanup = forceEnd;
  target.setPointerCapture(pointerId);
  target.addEventListener("pointermove", handleMove);
  target.addEventListener("pointerup", handleEnd);
  target.addEventListener("pointercancel", handleEnd);
}

/** Pointer drag that resizes a column against its neighbor while keeping total width. */
export function startNeighborColumnResize(options: {
  event: ReactPointerEvent<HTMLElement>;
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
}): void {
  const {
    event,
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
  const startClientX = event.clientX;

  startPointerColumnDrag(
    event,
    (clientX) => {
      const rawDelta = clientX - startClientX;
      const delta = Math.round(direction === "rtl" ? -rawDelta : rawDelta);
      onChange(
        applyNeighborResize(startSizing, columnId, neighborId, delta, {
          columnMin,
          columnMax,
          neighborMin,
          neighborMax,
        })
      );
    },
    onEnd
  );
}

export type DonorColumn = { id: string; min: number; max: number };

/**
 * Grow exactly one column (`growCol`) by up to `amount`, pulling the width
 * from a chain of donor columns in order (nearest first). A donor pinned at
 * its own min doesn't stall the pull: the remainder cascades to the next
 * donor in the chain that still has room. `growCol` only grows by as much as
 * its own max *and* the chain combined can actually supply, so total width
 * across growCol + chain is conserved.
 */
function growFromChain(
  sizing: ColumnSizingState,
  growCol: DonorColumn,
  chain: DonorColumn[],
  amount: number
): ColumnSizingState {
  const next: ColumnSizingState = { ...sizing };
  // Integer pixels only — fractional grants + per-column Math.round let the
  // sum of column sizes drift from the table width by 1px, and the overlay
  // resize handles (positioned from that sum) then sit off the real cell edges.
  const grant = Math.round(amount);
  if (grant <= 0) return next;

  const current = sizing[growCol.id] ?? growCol.min;
  const capByOwnMax = Math.max(0, growCol.max - current);

  const givable = chain.map((donor) => {
    const donorCurrent = sizing[donor.id] ?? donor.min;
    return Math.max(0, donorCurrent - donor.min);
  });
  const capByChain = givable.reduce((sum, value) => sum + value, 0);

  const totalGrant = Math.min(grant, capByOwnMax, capByChain);
  let remaining = totalGrant;

  chain.forEach((donor, index) => {
    if (remaining <= 0) return;
    const take = Math.min(givable[index], remaining);
    const donorCurrent = sizing[donor.id] ?? donor.min;
    next[donor.id] = donorCurrent - take;
    remaining -= take;
  });

  next[growCol.id] = current + totalGrant;
  return next;
}

/**
 * Resize an interior column border: dragging one way grows `leftChain[0]`
 * (pulling from `rightChain`, nearest column first); dragging the other way
 * grows `rightChain[0]` (pulling from `leftChain`). Both chains cascade past
 * any column pinned at its own min/max by an earlier, unrelated drag, so
 * resizing back is never stranded by a squeezed neighbor on either side.
 */
export function applyBorderResize(
  sizing: ColumnSizingState,
  leftChain: DonorColumn[],
  rightChain: DonorColumn[],
  delta: number
): ColumnSizingState {
  if (delta > 0 && leftChain.length > 0) {
    return growFromChain(sizing, leftChain[0], rightChain, delta);
  }
  if (delta < 0 && rightChain.length > 0) {
    return growFromChain(sizing, rightChain[0], leftChain, -delta);
  }
  return { ...sizing };
}

/**
 * Pointer drag that resizes an interior column border symmetrically in both
 * directions (see `applyBorderResize`) — a column pinned at its min/max by
 * an earlier drag can't strand the handle on either side of it.
 */
export function startBorderColumnResize(options: {
  event: ReactPointerEvent<HTMLElement>;
  leftChain: DonorColumn[];
  rightChain: DonorColumn[];
  startSizing: ColumnSizingState;
  /** LTR: positive dx grows the left column. RTL: inverted. */
  direction: "ltr" | "rtl";
  onChange: (sizing: ColumnSizingState) => void;
  onEnd?: () => void;
}): void {
  const { event, leftChain, rightChain, startSizing, direction, onChange, onEnd } =
    options;
  const startClientX = event.clientX;

  startPointerColumnDrag(
    event,
    (clientX) => {
      const rawDelta = clientX - startClientX;
      const delta = Math.round(direction === "rtl" ? -rawDelta : rawDelta);
      onChange(applyBorderResize(startSizing, leftChain, rightChain, delta));
    },
    onEnd
  );
}

/** Cumulative right-edge x-offset (px, from the table's start edge) of each leaf column. */
export function getColumnRightEdges<TData, TValue>(
  columns: Column<TData, TValue>[]
): number[] {
  let cumulative = 0;
  return columns.map((column) => {
    cumulative += column.getSize();
    return cumulative;
  });
}

/** Grow/shrink a single column's own width — used by the trailing edge of the last resizable column. */
export function applyEdgeResize(
  sizing: ColumnSizingState,
  columnId: string,
  delta: number,
  limits: { min: number; max: number }
): ColumnSizingState {
  const start = sizing[columnId] ?? limits.min;
  const next = Math.min(limits.max, Math.max(limits.min, start + Math.round(delta)));
  return { ...sizing, [columnId]: next };
}

/**
 * Pointer drag that resizes a single column's own width (no neighbor pairing).
 * Used for the trailing edge of the last resizable column, where there is no
 * resizable column to its right to borrow space from/give space to.
 */
export function startEdgeColumnResize(options: {
  event: ReactPointerEvent<HTMLElement>;
  columnId: string;
  startSizing: ColumnSizingState;
  min: number;
  max: number;
  direction: "ltr" | "rtl";
  onChange: (sizing: ColumnSizingState) => void;
  onEnd?: () => void;
}): void {
  const { event, columnId, startSizing, min, max, direction, onChange, onEnd } = options;
  const startClientX = event.clientX;

  startPointerColumnDrag(
    event,
    (clientX) => {
      const rawDelta = clientX - startClientX;
      const delta = Math.round(direction === "rtl" ? -rawDelta : rawDelta);
      onChange(applyEdgeResize(startSizing, columnId, delta, { min, max }));
    },
    onEnd
  );
}
