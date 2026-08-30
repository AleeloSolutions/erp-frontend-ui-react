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
  /** Last unchecked row — persistent hover-style row background. */
  activeRowId?: string | null;
  /** Clear last-unchecked emphasis when another row is clicked. */
  onClearActiveRow?: () => void;
  /** Optional per-row `<tr>` classes (e.g. `[&>td]:text-erp-brand-third`). */
  getRowClassName?: (row: TData) => string | undefined;
}

function DataRow<TData>({
  row,
  activeRowId,
  onClearActiveRow,
  getRowClassName,
}: {
  row: Row<TData>;
  activeRowId?: string | null;
  onClearActiveRow?: () => void;
  getRowClassName?: (row: TData) => string | undefined;
}) {
  const isSelected = row.getIsSelected();
  const isActive = !isSelected && activeRowId != null && row.id === activeRowId;
  const rowClassName = getRowClassName?.(row.original);

  return (
    <tr
      onClick={() => {
        if (activeRowId != null && row.id !== activeRowId) {
          onClearActiveRow?.();
        }
      }}
      className={cn(
        "odd:[&>td]:bg-erp-table-odd even:[&>td]:bg-erp-table-even",
        "odd:hover:[&>td]:bg-erp-table-odd-hover even:hover:[&>td]:bg-erp-table-even-hover",
        isActive && "[&>td]:!bg-erp-table-checked-active",
        isSelected && "[&>td]:!bg-erp-brand-third-overlay",
        rowClassName
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
              "h-10 overflow-hidden border-b border-erp-table-border text-[14px] text-erp-text align-middle whitespace-nowrap",
              isSelect || isActions ? "p-0" : "py-1",
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
  activeRowId,
  onClearActiveRow,
  getRowClassName,
}: {
  rows: Row<TData>[];
  columnIds: string[];
  colSpan: number;
  depth?: number;
  activeRowId?: string | null;
  onClearActiveRow?: () => void;
  getRowClassName?: (row: TData) => string | undefined;
}) {
  if (columnIds.length === 0) {
    return (
      <>
        {rows.map((row) => (
          <DataRow
            key={row.id}
            row={row}
            activeRowId={activeRowId}
            onClearActiveRow={onClearActiveRow}
            getRowClassName={getRowClassName}
          />
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
                <span className="min-w-0 truncate text-[14px] font-medium text-erp-text">
                  {groupName}
                </span>
                <span className="ms-auto shrink-0 text-[14px] text-erp-muted">
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
            activeRowId={activeRowId}
            onClearActiveRow={onClearActiveRow}
            getRowClassName={getRowClassName}
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
  activeRowId = null,
  onClearActiveRow,
  getRowClassName,
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
        <GroupedRows
          rows={rows}
          columnIds={groupingColumnIds}
          colSpan={colSpan}
          activeRowId={activeRowId}
          onClearActiveRow={onClearActiveRow}
          getRowClassName={getRowClassName}
        />
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => (
        <DataRow
          key={row.id}
          row={row}
          activeRowId={activeRowId}
          onClearActiveRow={onClearActiveRow}
          getRowClassName={getRowClassName}
        />
      ))}
    </tbody>
  );
}
