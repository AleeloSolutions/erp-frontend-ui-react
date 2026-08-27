import { useState, type PointerEvent } from "react";
import type { ColumnSizingState, Table } from "@tanstack/react-table";
import { cn } from "../../utils";
import {
  getColumnRightEdges,
  startBorderColumnResize,
  startTrailingEdgeColumnResize,
  type DonorColumn,
} from "./column-width";

/** Invisible draggable hit zone, centered on the column border (px). */
const HIT_WIDTH_PX = 10;
const DEFAULT_MIN_SIZE = 44;
const DEFAULT_MAX_SIZE = 640;

type HandleSpec =
  | {
      kind: "pair";
      id: string;
      position: number;
      leftChain: DonorColumn[];
      rightChain: DonorColumn[];
    }
  | {
      kind: "trailing";
      id: string;
      position: number;
      column: DonorColumn;
      leftDonors: DonorColumn[];
    };

export interface DataTableColumnResizerProps<TData> {
  table: Table<TData>;
  enabled: boolean;
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (sizing: ColumnSizingState) => void;
  columnResizeDirection: "ltr" | "rtl";
  /** Header row height (px) — handles span the header only. */
  headerHeight: number;
}

/**
 * Resize handles overlaid on the header row. Not sticky / not `position` on
 * the `<th>` cells — this layer sits in the table wrapper and scrolls away
 * with the header. Trailing-edge resize conserves total width so the table
 * stays full-container-wide.
 */
export function DataTableColumnResizer<TData>({
  table,
  enabled,
  columnSizing,
  onColumnSizingChange,
  columnResizeDirection,
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
  if (
    lastResizableIndex !== -1 &&
    (lastResizableIndex === leafColumns.length - 1 || !canResize[lastResizableIndex + 1])
  ) {
    const column = leafColumns[lastResizableIndex];
    const leftDonors: DonorColumn[] = [];
    for (let j = lastResizableIndex - 1; j >= 0; j -= 1) {
      if (!canResize[j]) continue;
      leftDonors.push(donorSpec(leafColumns[j]));
    }
    handles.push({
      kind: "trailing",
      id: `edge-${column.id}`,
      position: rightEdges[lastResizableIndex],
      column: donorSpec(column),
      leftDonors,
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
      const startSizing: ColumnSizingState = { ...columnSizing };
      [handle.column, ...handle.leftDonors].forEach((entry) => {
        startSizing[entry.id] = table.getColumn(entry.id)?.getSize() ?? entry.min;
      });
      startTrailingEdgeColumnResize({
        event,
        column: handle.column,
        leftDonors: handle.leftDonors,
        startSizing,
        direction: columnResizeDirection,
        onChange: onColumnSizingChange,
        onEnd: () => setActiveId(null),
      });
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0">
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
