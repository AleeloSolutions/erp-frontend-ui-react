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
  const iconClass = "h-3 w-3 shrink-0";
  if (sorted === "asc") return <ArrowUp className={iconClass} aria-hidden />;
  if (sorted === "desc") return <ArrowDown className={iconClass} aria-hidden />;
  return (
    <ArrowUpDown
      className={cn(iconClass, "opacity-0 group-hover/th:opacity-100")}
      aria-hidden
    />
  );
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
          "group/th sticky top-0 z-10 h-10 border-b border-erp-table-border bg-erp-table-header p-0 align-middle",
          isSelect ? "overflow-visible pe-1" : "overflow-hidden",
          padEnd && "pe-9"
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
        "group/th sticky top-0 z-10 h-10 overflow-hidden border-b border-erp-table-border bg-erp-table-header px-4 py-2 text-start text-[0.875rem] font-medium whitespace-nowrap text-erp-text align-middle",
        canSort && "cursor-pointer",
        padEnd && "pe-9",
        alignRight && "text-end"
      )}
    >
      {header.isPlaceholder ? null : (
        <>
          <div className="relative flex min-w-0 items-center">
            {canSort ? (
              <button
                type="button"
                title={label}
                className="flex min-w-0 max-w-full flex-1 items-center"
                onClick={header.column.getToggleSortingHandler()}
              >
                <span
                  className={cn(
                    "block min-w-0 flex-1 truncate",
                    alignRight && "text-end"
                  )}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </span>
                <span className="ms-2 flex w-3 shrink-0 justify-center">
                  <SortIcon sorted={sorted} />
                </span>
              </button>
            ) : (
              <span
                title={label}
                className={cn("block min-w-0 flex-1 truncate", alignRight && "text-end")}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </span>
            )}
          </div>
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
                "absolute inset-y-0 z-10 w-1.5 cursor-col-resize touch-none select-none bg-erp-text/25 opacity-0 hover:opacity-50",
                handleOnEndEdge ? "end-0" : "start-0"
              )}
            />
          ) : null}
        </>
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
