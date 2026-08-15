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
        "hover:[&>td]:bg-[#FAFCFE]",
        row.getIsSelected() &&
          "[&>td]:bg-[#EEF5FC] [&>td:first-child]:shadow-[inset_3px_0_0_var(--blue)]"
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const alignRight = cell.column.columnDef.meta?.align === "right";
        const isSelect = cell.column.id === "__select";
        return (
          <td
            key={cell.id}
            style={getColumnCellStyle(cell.column)}
            className={cn(
              "h-[34px] border-b border-[#EEF2F6] bg-white text-[11px] whitespace-nowrap text-[#2F3A4A] align-middle",
              isSelect ? "p-0" : "px-2",
              alignRight && "text-right tabular-nums tracking-[-0.15px]"
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                className="!border-b !border-[#DCE7F2] !bg-[#F7FAFD] !p-0"
              >
                <div className="flex min-h-[38px] items-center gap-2 px-3">
                  <span className="inline-flex h-5 items-center rounded-full bg-[#EAF3FC] px-1.5 text-[9px] font-extrabold uppercase tracking-[0.45px] text-[#3E5F84]">
                    {groupingColumnId}
                  </span>
                  <span className="text-[11px] font-extrabold text-[#334155]">
                    {groupName}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-[#667085]">
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
