import type { ReactNode } from "react";
import type { Header, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../utils";
import { getColumnCellStyle, startNeighborColumnResize } from "./column-width";
import type { ColumnSizingState } from "@tanstack/react-table";
import "../../types/table";

export interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  enableResizing?: boolean;
  /** Must match TanStack `columnResizeDirection` so drag delta matches handle edge. */
  columnResizeDirection?: "ltr" | "rtl";
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (sizing: ColumnSizingState) => void;
  /** Overlay at the end of the header row — not a data column. */
  columnsMenu?: ReactNode;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" aria-hidden />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" aria-hidden />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />;
}

function headerLabelText<TData>(header: Header<TData, unknown>): string {
  const metaTip = header.column.columnDef.meta?.tooltip;
  if (metaTip) return metaTip;
  const def = header.column.columnDef.header;
  if (typeof def === "string") return def;
  return header.column.id;
}

function HeaderCell<TData>({
  header,
  enableResizing,
  columnResizeDirection = "ltr",
  neighborId,
  columnSizing,
  onColumnSizingChange,
  padEnd,
}: {
  header: Header<TData, unknown>;
  enableResizing?: boolean;
  columnResizeDirection?: "ltr" | "rtl";
  neighborId?: string;
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (sizing: ColumnSizingState) => void;
  padEnd?: boolean;
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const alignRight = header.column.columnDef.meta?.align === "right";
  const isSelect = header.column.id === "__select";
  const isActions = header.column.id === "__actions";
  const handleOnEndEdge = columnResizeDirection === "ltr";
  const label = headerLabelText(header);
  const canNeighborResize = Boolean(
    enableResizing && header.column.getCanResize() && neighborId
  );

  if (isSelect || isActions) {
    return (
      <th
        key={header.id}
        colSpan={header.colSpan}
        style={getColumnCellStyle(header.column)}
        className={cn(
          "relative h-8 border-b border-erp-border-strong bg-erp-surface-tint p-0 align-middle",
          isSelect ? "overflow-visible" : "overflow-hidden",
          padEnd && "pe-10"
        )}
      >
        {isSelect && !header.isPlaceholder
          ? flexRender(header.column.columnDef.header, header.getContext())
          : null}
      </th>
    );
  }

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      style={getColumnCellStyle(header.column)}
      className={cn(
        "relative h-8 border-b border-erp-border-strong bg-erp-surface-tint px-2 text-left text-[10px] font-bold whitespace-nowrap text-erp-muted align-middle",
        padEnd ? "overflow-visible pe-10" : "overflow-hidden",
        alignRight && "text-right"
      )}
    >
      {header.isPlaceholder ? null : (
        <div
          className={cn(
            "flex min-h-8 min-w-0 items-center justify-between gap-2 overflow-hidden",
            alignRight && "justify-end"
          )}
        >
          {canSort ? (
            <button
              type="button"
              title={label}
              className="inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden hover:text-erp-primary"
              onClick={header.column.getToggleSortingHandler()}
            >
              <span className="min-w-0 truncate">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              <SortIcon sorted={sorted} />
            </button>
          ) : (
            <span title={label} className="min-w-0 truncate">
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          )}
          {canNeighborResize && neighborId ? (
            <span
              role="separator"
              aria-orientation="vertical"
              aria-hidden
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const neighbor = header.getContext().table.getColumn(neighborId);
                if (!neighbor) return;
                startNeighborColumnResize({
                  startClientX: event.clientX,
                  columnId: header.column.id,
                  neighborId,
                  startSizing: {
                    ...columnSizing,
                    [header.column.id]: header.column.getSize(),
                    [neighborId]: neighbor.getSize(),
                  },
                  columnMin: header.column.columnDef.minSize ?? 72,
                  columnMax: header.column.columnDef.maxSize ?? 640,
                  neighborMin: neighbor.columnDef.minSize ?? 72,
                  neighborMax: neighbor.columnDef.maxSize ?? 640,
                  direction: columnResizeDirection,
                  onChange: onColumnSizingChange,
                });
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                const touch = event.touches[0];
                if (!touch) return;
                const neighbor = header.getContext().table.getColumn(neighborId);
                if (!neighbor) return;
                startNeighborColumnResize({
                  startClientX: touch.clientX,
                  columnId: header.column.id,
                  neighborId,
                  startSizing: {
                    ...columnSizing,
                    [header.column.id]: header.column.getSize(),
                    [neighborId]: neighbor.getSize(),
                  },
                  columnMin: header.column.columnDef.minSize ?? 72,
                  columnMax: header.column.columnDef.maxSize ?? 640,
                  neighborMin: neighbor.columnDef.minSize ?? 72,
                  neighborMax: neighbor.columnDef.maxSize ?? 640,
                  direction: columnResizeDirection,
                  onChange: onColumnSizingChange,
                });
              }}
              className={cn(
                "absolute inset-y-0 z-10 w-3 cursor-col-resize touch-none select-none",
                handleOnEndEdge ? "right-0" : "left-0",
                "after:absolute after:inset-y-1.5 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-erp-border after:content-['']",
                "hover:after:w-0.5 hover:after:bg-erp-border-strong"
              )}
            />
          ) : null}
        </div>
      )}
    </th>
  );
}

export function DataTableHeader<TData>({
  table,
  enableResizing,
  columnResizeDirection = "ltr",
  columnSizing,
  onColumnSizingChange,
  columnsMenu,
}: DataTableHeaderProps<TData>) {
  const leafIds = table.getVisibleLeafColumns().map((column) => column.id);
  const lastLeafId = leafIds[leafIds.length - 1];

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const index = leafIds.indexOf(header.column.id);
            const neighborId =
              columnResizeDirection === "ltr" ? leafIds[index + 1] : leafIds[index - 1];
            const neighborColumn = neighborId ? table.getColumn(neighborId) : undefined;
            const neighborResizable =
              neighborColumn != null &&
              neighborColumn.getCanResize() &&
              neighborColumn.id !== "__select" &&
              neighborColumn.id !== "__actions";
            const isLastData =
              Boolean(columnsMenu) &&
              header.column.id === lastLeafId &&
              header.column.id !== "__select" &&
              header.column.id !== "__actions";

            return (
              <HeaderCell
                key={header.id}
                header={header}
                enableResizing={enableResizing}
                columnResizeDirection={columnResizeDirection}
                neighborId={neighborResizable ? neighborId : undefined}
                columnSizing={columnSizing}
                onColumnSizingChange={onColumnSizingChange}
                padEnd={isLastData}
              />
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
