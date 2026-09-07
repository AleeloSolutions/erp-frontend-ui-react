import type { ReactNode } from "react";
import type { Header, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "../../utils";
import { getColumnCellStyle } from "./column-width";
import "../../types/table";

export interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  /** Rendered inside the `__actions` header cell (not absolutely positioned). */
  columnsMenu?: ReactNode;
  /**
   * When set, `<th>` cells stick at this viewport offset so the header stays
   * visible while the page scrolls (under Navbar / ControlPanel).
   */
  stickyTop?: number;
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
  columnsMenu,
  stickyTop,
}: {
  header: Header<TData, unknown>;
  columnsMenu?: ReactNode;
  stickyTop?: number;
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const alignRight = header.column.columnDef.meta?.align === "right";
  const isSelect = header.column.id === "__select";
  const isActions = header.column.id === "__actions";
  const label = headerLabelText(header);
  const sticky = stickyTop != null;
  const cellStyle = {
    ...getColumnCellStyle(header.column),
    ...(sticky ? { top: stickyTop } : null),
  };

  if (isSelect) {
    return (
      <th
        colSpan={header.colSpan}
        style={cellStyle}
        className={cn(
          "h-10 overflow-visible border-b border-erp-table-border bg-erp-table-header p-0 align-middle",
          sticky && "sticky z-10"
        )}
      >
        {!header.isPlaceholder
          ? flexRender(header.column.columnDef.header, header.getContext())
          : null}
      </th>
    );
  }

  if (isActions) {
    return (
      <th
        colSpan={header.colSpan}
        style={cellStyle}
        className={cn(
          "h-10 overflow-hidden border-b border-erp-table-border bg-erp-table-header p-0 align-middle",
          sticky && "sticky z-10"
        )}
      >
        {columnsMenu ? (
          <div className="grid h-10 w-full place-items-center">{columnsMenu}</div>
        ) : null}
      </th>
    );
  }

  return (
    <th
      colSpan={header.colSpan}
      style={cellStyle}
      className={cn(
        "h-10 overflow-hidden border-b border-erp-table-border bg-erp-table-header text-[14px] font-medium whitespace-nowrap text-erp-text align-middle",
        sticky && "sticky z-10",
        canSort && "cursor-pointer",
        alignRight ? "text-end" : "text-start"
      )}
    >
      {header.isPlaceholder ? null : (
        <div
          className={cn(
            "flex h-10 w-full min-w-0 items-center",
            alignRight && "justify-end"
          )}
        >
          {canSort ? (
            <button
              type="button"
              title={label}
              className="inline-flex max-w-full min-w-0 items-center gap-1 hover:text-erp-primary"
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
        </div>
      )}
    </th>
  );
}

export function DataTableHeader<TData>({
  table,
  columnsMenu,
  stickyTop,
}: DataTableHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <HeaderCell
              key={header.id}
              header={header}
              stickyTop={stickyTop}
              columnsMenu={header.column.id === "__actions" ? columnsMenu : undefined}
            />
          ))}
        </tr>
      ))}
    </thead>
  );
}
