import { Fragment } from "react";
import type { Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "../../utils";
import { DataTableEmpty } from "./DataTableEmpty";
import { getColumnCellStyle } from "./column-width";
import "../../types/table";

export interface DataTableBodyProps<TData> {
  table: Table<TData>;
  emptyMessage?: string;
  groupingColumnId?: string;
}

function DataRow<TData>({ row }: { row: Row<TData> }) {
  return (
    <tr
      className={cn(
        "hover:[&>td]:bg-erp-surface-tint-strong",
        row.getIsSelected() &&
          "[&>td]:bg-erp-blue-50 [&>td:first-child]:shadow-[inset_3px_0_0_var(--blue)]"
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const alignRight = cell.column.columnDef.meta?.align === "right";
        const isSelect = cell.column.id === "__select";
        const isActions = cell.column.id === "__actions";
        const skipTruncate = isSelect || isActions;

        return (
          <td
            key={cell.id}
            style={getColumnCellStyle(cell.column)}
            className={cn(
              "h-[34px] border-b border-erp-border-soft bg-white text-[11px] text-erp-text align-middle overflow-hidden",
              isSelect || isActions ? "p-0" : "px-2",
              alignRight && "text-right tabular-nums tracking-[-0.15px]"
            )}
          >
            {skipTruncate ? (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            ) : (
              <div className="min-w-0 max-w-full truncate whitespace-nowrap">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

export function DataTableBody<TData>({
  table,
  emptyMessage,
  groupingColumnId,
}: DataTableBodyProps<TData>) {
  const rows = table.getRowModel().rows;
  const colSpan = Math.max(table.getVisibleLeafColumns().length, 1);

  if (rows.length === 0) {
    return (
      <tbody>
        <DataTableEmpty colSpan={colSpan} message={emptyMessage} />
      </tbody>
    );
  }

  if (groupingColumnId) {
    const groups = new Map<string, Row<TData>[]>();
    rows.forEach((row) => {
      const raw = row.getValue(groupingColumnId);
      const key = String(raw ?? "Unspecified");
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    });

    return (
      <tbody>
        {[...groups.entries()].map(([groupName, groupRows]) => (
          <Fragment key={`group-${groupName}`}>
            <tr className="table-group-row">
              <td
                colSpan={colSpan}
                className="!border-b !border-erp-border-chip !bg-erp-surface-hover !p-0"
              >
                <div className="flex min-h-[38px] items-center gap-2 px-3">
                  <span className="inline-flex h-5 items-center rounded-full bg-erp-blue-50 px-1.5 text-[9px] font-extrabold uppercase tracking-[0.45px] text-erp-blue">
                    {groupingColumnId}
                  </span>
                  <span className="min-w-0 truncate text-[11px] font-extrabold text-erp-text">
                    {groupName}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-bold text-erp-muted">
                    {groupRows.length} item{groupRows.length === 1 ? "" : "s"}
                  </span>
                </div>
              </td>
            </tr>
            {groupRows.map((row) => (
              <DataRow key={row.id} row={row} />
            ))}
          </Fragment>
        ))}
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => (
        <DataRow key={row.id} row={row} />
      ))}
    </tbody>
  );
}
