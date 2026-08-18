import { Fragment } from "react";
import type { Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { cn } from "../../utils";
import { DataTableEmpty } from "./DataTableEmpty";
import { DataTableTruncatedCell } from "./DataTableTruncatedCell";
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
        "odd:[&>td]:bg-erp-table-odd even:[&>td]:bg-erp-table-even",
        "odd:hover:[&>td]:bg-erp-table-odd-hover even:hover:[&>td]:bg-erp-table-even-hover",
        row.getIsSelected() &&
          "[&>td]:!bg-erp-table-selected hover:[&>td]:!bg-erp-table-selected"
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
              "h-10 overflow-hidden border-b border-erp-table-border text-[11px] text-erp-text align-middle whitespace-nowrap",
              isSelect || isActions ? "p-0" : "px-4 py-1",
              isSelect && "overflow-visible text-center",
              alignRight && "text-end tabular-nums"
            )}
          >
            {skipTruncate ? (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            ) : (
              <DataTableTruncatedCell value={cell.getValue()}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </DataTableTruncatedCell>
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
              className="!border-b !border-erp-table-border !bg-erp-table-header !p-0"
            >
              <div
                className="flex h-10 items-center gap-2 px-4"
                style={{ paddingInlineStart: 16 + pad }}
              >
                <span className="inline-flex items-center rounded-full bg-erp-info-bg px-[0.65em] py-[0.25em] text-[0.75em] font-medium text-erp-info">
                  {columnId}
                </span>
                <span className="min-w-0 truncate text-[11px] font-medium text-erp-text">
                  {groupName}
                </span>
                <span className="ms-auto shrink-0 text-[11px] text-erp-muted">
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
