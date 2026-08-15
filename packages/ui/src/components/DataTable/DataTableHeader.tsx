import type { Header, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../utils";
import { getColumnCellStyle } from "./column-width";
import "../../types/table";

export interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  enableResizing?: boolean;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" aria-hidden />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" aria-hidden />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />;
}

function HeaderCell<TData>({
  header,
  enableResizing,
}: {
  header: Header<TData, unknown>;
  enableResizing?: boolean;
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const alignRight = header.column.columnDef.meta?.align === "right";
  const isSelect = header.column.id === "__select";

  if (isSelect) {
    return (
      <th
        key={header.id}
        colSpan={header.colSpan}
        style={getColumnCellStyle(header.column)}
        className="relative h-8 border-b border-[#D9E2EC] bg-[#F8FAFC] p-0 align-middle"
      >
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </th>
    );
  }

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      style={getColumnCellStyle(header.column)}
      className={cn(
        "relative h-8 border-b border-[#D9E2EC] bg-[#F8FAFC] px-2 text-left text-[10px] font-bold whitespace-nowrap text-[#556274] align-middle",
        alignRight && "text-right"
      )}
    >
      {header.isPlaceholder ? null : (
        <div
          className={cn(
            "flex min-h-8 items-center justify-between gap-2",
            alignRight && "justify-end"
          )}
        >
          {canSort ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-erp-blue"
              onClick={header.column.getToggleSortingHandler()}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              <SortIcon sorted={sorted} />
            </button>
          ) : (
            <span>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          )}
          {enableResizing && header.column.getCanResize() ? (
            <span
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={cn(
                "absolute top-0 right-0 h-full w-2.5 cursor-col-resize touch-none select-none",
                "after:absolute after:top-[7px] after:bottom-[7px] after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-[#D3DCE6] after:content-['']",
                "hover:after:w-0.5 hover:after:bg-[#7DA4D6]",
                header.column.getIsResizing() && "after:w-0.5 after:bg-[#7DA4D6]"
              )}
              aria-hidden
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
}: DataTableHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <HeaderCell
              key={header.id}
              header={header}
              enableResizing={enableResizing}
            />
          ))}
        </tr>
      ))}
    </thead>
  );
}
