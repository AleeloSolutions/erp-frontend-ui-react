import { useState, type PointerEvent } from "react";
import type { ColumnSizingState, Table } from "@tanstack/react-table";
import { cn } from "../../utils";
import {
  getColumnRightEdges,
  startBorderColumnResize,
  startEdgeColumnResize,
  type DonorColumn,
} from "./column-width";

/** Invisible draggable hit zone, centered on the column border (px). Wider than the visible line so it stays grabbable at any column width. */
const HIT_WIDTH_PX = 10;
const DEFAULT_MIN_SIZE = 44;
const DEFAULT_MAX_SIZE = 640;

type HandleSpec =
  | {
      kind: "pair";
      id: string;
      position: number;
      /**
       * Resizable columns on each side of this border, nearest-to-border
       * first. Dragging one way grows leftChain[0] by pulling from
       * rightChain; dragging the other way grows rightChain[0] by pulling
       * from leftChain. Either chain cascades past a column pinned at its
       * own min/max by a different border's drag instead of getting stuck
       * on just the immediate neighbor.
       */
      leftChain: DonorColumn[];
      rightChain: DonorColumn[];
    }
  | {
      kind: "edge";
      id: string;
      position: number;
      columnId: string;
      min: number;
      max: number;
    };

export interface DataTableColumnResizerProps<TData> {
  table: Table<TData>;
  enabled: boolean;
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (sizing: ColumnSizingState) => void;
  columnResizeDirection: "ltr" | "rtl";
  /** Sticky `top` offset (px) — matches the header row's, since both stick against the page scroll. */
  stickyTop: number;
  /**
   * Header row's real rendered height (px), pre-corrected for the current
   * browser zoom (see DataTable's measuring effect) so that applying it as a
   * plain inline `px` height — which the browser re-scales by zoom once more
   * at render — reconstructs the header's true on-screen height instead of
   * doubling the zoom.
   */
  headerHeight: number;
}

/**
 * Resize handles rendered as a flat overlay layer (siblings of `<table>`, not
 * children of individual `<th>`s). A handle nested inside one `<th>` can't
 * visually/functionally extend into the neighboring `<th>`'s box — adjacent
 * table cells are separate stacking contexts, and the later one always paints
 * over the earlier one's overflow. Rendering handles as one overlay avoids
 * that entirely, which is what lets the hit zone stay wide and centered on
 * the border regardless of how narrow either column gets.
 */
export function DataTableColumnResizer<TData>({
  table,
  enabled,
  columnSizing,
  onColumnSizingChange,
  columnResizeDirection,
  stickyTop,
  headerHeight,
}: DataTableColumnResizerProps<TData>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!enabled) return null;

  const leafColumns = table.getVisibleLeafColumns();
  if (leafColumns.length === 0) return null;

  const rightEdges = getColumnRightEdges(leafColumns);
  const canResize = leafColumns.map(
    (column) =>
      column.getCanResize() && column.id !== "__select" && column.id !== "__actions"
  );

  const handles: HandleSpec[] = [];

  const donorSpec = (column: (typeof leafColumns)[number]): DonorColumn => ({
    id: column.id,
    min: column.columnDef.minSize ?? DEFAULT_MIN_SIZE,
    max: column.columnDef.maxSize ?? DEFAULT_MAX_SIZE,
  });

  for (let i = 0; i < leafColumns.length - 1; i += 1) {
    if (!canResize[i] || !canResize[i + 1]) continue;

    const leftChain: DonorColumn[] = [];
    for (let j = i; j >= 0; j -= 1) {
      if (!canResize[j]) continue;
      leftChain.push(donorSpec(leafColumns[j]));
    }

    const rightChain: DonorColumn[] = [];
    for (let j = i + 1; j < leafColumns.length; j += 1) {
      if (!canResize[j]) continue;
      rightChain.push(donorSpec(leafColumns[j]));
    }

    handles.push({
      kind: "pair",
      id: `border-${leafColumns[i].id}-${leafColumns[i + 1].id}`,
      position: rightEdges[i],
      leftChain,
      rightChain,
    });
  }

  let lastResizableIndex = -1;
  for (let i = leafColumns.length - 1; i >= 0; i -= 1) {
    if (canResize[i]) {
      lastResizableIndex = i;
      break;
    }
  }
  // The last resizable column's own trailing edge — e.g. when it's followed by a
  // fixed __actions column, or when it's simply the last column in the table.
  if (
    lastResizableIndex !== -1 &&
    (lastResizableIndex === leafColumns.length - 1 || !canResize[lastResizableIndex + 1])
  ) {
    const column = leafColumns[lastResizableIndex];
    handles.push({
      kind: "edge",
      id: `edge-${column.id}`,
      position: rightEdges[lastResizableIndex],
      columnId: column.id,
      min: column.columnDef.minSize ?? DEFAULT_MIN_SIZE,
      max: column.columnDef.maxSize ?? DEFAULT_MAX_SIZE,
    });
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>, handle: HandleSpec) {
    setActiveId(handle.id);
    if (handle.kind === "pair") {
      const startSizing: ColumnSizingState = { ...columnSizing };
      [...handle.leftChain, ...handle.rightChain].forEach((entry) => {
        startSizing[entry.id] = table.getColumn(entry.id)?.getSize() ?? entry.min;
      });
      startBorderColumnResize({
        event,
        leftChain: handle.leftChain,
        rightChain: handle.rightChain,
        startSizing,
        direction: columnResizeDirection,
        onChange: onColumnSizingChange,
        onEnd: () => setActiveId(null),
      });
    } else {
      startEdgeColumnResize({
        event,
        columnId: handle.columnId,
        startSizing: {
          ...columnSizing,
          [handle.columnId]: table.getColumn(handle.columnId)?.getSize() ?? handle.min,
        },
        min: handle.min,
        max: handle.max,
        direction: columnResizeDirection,
        onChange: onColumnSizingChange,
        onEnd: () => setActiveId(null),
      });
    }
  }

  return (
    <div className="pointer-events-none sticky z-20 h-0" style={{ top: stickyTop }}>
      <div className="relative">
        {handles.map((handle) => (
          <div
            key={handle.id}
            role="separator"
            aria-orientation="vertical"
            aria-hidden
            className="group pointer-events-auto absolute top-0 z-20 flex cursor-col-resize touch-none justify-center select-none"
            style={{
              insetInlineStart: handle.position - HIT_WIDTH_PX / 2,
              width: HIT_WIDTH_PX,
              height: headerHeight,
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              if (!event.isPrimary) return;
              event.preventDefault();
              event.stopPropagation();
              beginDrag(event, handle);
            }}
          >
            <span
              className={cn(
                "h-full w-px bg-erp-text/25",
                "group-hover:w-0.5 group-hover:bg-erp-primary",
                activeId === handle.id && "w-0.5 bg-erp-primary"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
