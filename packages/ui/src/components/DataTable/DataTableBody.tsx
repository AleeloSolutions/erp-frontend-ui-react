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
  /** One or more column ids — nested group headers in order. */
  groupingColumnIds?: string[];
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

function GroupedRows<TData>({
  rows,
  columnIds,
  colSpan,
  depth = 0,
}: {
  rows: Row<TData>[];
  columnIds: string[];
  colSpan: number;
  depth?: number;
}) {
  if (columnIds.length === 0) {
    return (
      <>
        {rows.map((row) => (
          <DataRow key={row.id} row={row} />
        ))}
      </>
    );
  }

  const [columnId, ...rest] = columnIds;
  const groups = new Map<string, Row<TData>[]>();
  rows.forEach((row) => {
    const raw = row.getValue(columnId);
    const key = String(raw ?? "Unspecified");
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  });

  const pad = Math.min(depth, 4) * 12;

  return (
    <>
      {[...groups.entries()].map(([groupName, groupRows]) => (
        <Fragment key={`${columnId}:${groupName}:${depth}`}>
          <tr className="table-group-row">
            <td
              colSpan={colSpan}
              className="!border-b !border-erp-border-chip !bg-erp-surface-hover !p-0"
            >
              <div
                className="flex min-h-[38px] items-center gap-2 px-3"
                style={{ paddingInlineStart: 12 + pad }}
              >
                <span className="inline-flex h-5 items-center rounded-full bg-erp-blue-50 px-1.5 text-[9px] font-extrabold uppercase tracking-[0.45px] text-erp-blue">
                  {columnId}
                </span>
                <span className="min-w-0 truncate text-[11px] font-extrabold text-erp-text">
                  {groupName}
                </span>
                <span className="ms-auto shrink-0 text-[10px] font-bold text-erp-muted">
                  {groupRows.length} item{groupRows.length === 1 ? "" : "s"}
                </span>
              </div>
            </td>
          </tr>
          <GroupedRows
            rows={groupRows}
            columnIds={rest}
            colSpan={colSpan}
            depth={depth + 1}
          />
        </Fragment>
      ))}
    </>
  );
}

export function DataTableBody<TData>({
  table,
  emptyMessage,
  groupingColumnIds = [],
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

  if (groupingColumnIds.length > 0) {
    return (
      <tbody>
        <GroupedRows rows={rows} columnIds={groupingColumnIds} colSpan={colSpan} />
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
