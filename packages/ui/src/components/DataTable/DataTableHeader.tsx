import type { ReactNode } from "react";
import type { Header, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "../../utils";
import { getColumnCellStyle } from "./column-width";
import "../../types/table";

export interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  /** Overlay at the end of the header row — not a data column. */
  columnsMenu?: ReactNode;
}

/** Font Awesome `fa-sort` / `fa-sort-up` / `fa-sort-down` glyph. */
function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  return (
    <svg
      viewBox="0 0 320 512"
      className="h-3 w-2.5 shrink-0"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        opacity={sorted === "desc" ? 0.25 : sorted === "asc" ? 1 : 0.45}
        d="M182.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9S19.8 224 32 224h256c12.2 0 23.3-7.2 28.2-18.3s2.3-25.7-6.9-34.9l-128-128z"
      />
      <path
        fill="currentColor"
        opacity={sorted === "asc" ? 0.25 : sorted === "desc" ? 1 : 0.45}
        d="M182.6 470.6c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-9.2-9.2-11.9-22.9-6.9-34.9S19.8 288 32 288h256c12.2 0 23.3 7.2 28.2 18.3s2.3 25.7-6.9 34.9l-128 128z"
      />
    </svg>
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
  padEnd,
}: {
  header: Header<TData, unknown>;
  padEnd?: boolean;
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const alignRight = header.column.columnDef.meta?.align === "right";
  const isSelect = header.column.id === "__select";
  const isActions = header.column.id === "__actions";
  const label = headerLabelText(header);

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
        "group/th relative sticky top-0 z-10 h-10 border-b border-erp-table-border bg-erp-table-header py-2 text-[14px] font-weight-500 whitespace-nowrap text-erp-text align-middle !text-start",
        canSort && "cursor-pointer",
        padEnd && "pe-9",
        alignRight && "!text-end"
      )}
    >
      {header.isPlaceholder ? null : (
        <div className="flex w-full min-w-0 items-center">
          {canSort ? (
            <button
              type="button"
              title={label}
              className="flex w-full min-w-0 items-center gap-1 hover:text-erp-primary"
              onClick={header.column.getToggleSortingHandler()}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  alignRight ? "text-end" : "text-start"
                )}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              <SortIcon sorted={sorted} />
            </button>
          ) : (
            <span
              title={label}
              className={cn(
                "min-w-0 flex-1 truncate",
                alignRight ? "text-end" : "text-start"
              )}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          )}
        </div>
      )}
    </th>
  );
}

export function DataTableHeader<TData>({
  table,
  columnsMenu,
}: DataTableHeaderProps<TData>) {
  const leafIds = table.getVisibleLeafColumns().map((column) => column.id);
  const lastLeafId = leafIds[leafIds.length - 1];

  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isLastData =
              Boolean(columnsMenu) &&
              header.column.id === lastLeafId &&
              header.column.id !== "__select" &&
              header.column.id !== "__actions";

            return <HeaderCell key={header.id} header={header} padEnd={isLastData} />;
          })}
        </tr>
      ))}
    </thead>
  );
}
