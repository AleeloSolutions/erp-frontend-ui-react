import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils";
import { useUiTranslation } from "../../i18n";

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows: number;
  className?: string;
  /** When using server pagination, pass absolute page (1-based) info via table state */
  serverMode?: boolean;
}

export function DataTablePagination<TData>({
  table,
  totalRows,
  className,
}: DataTablePaginationProps<TData>) {
  const { t } = useUiTranslation("ui");
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className={cn("flex items-center gap-3 text-[13px] text-erp-text", className)}>
      <span className="whitespace-nowrap tabular-nums">
        {start}-{end} / {totalRows}
      </span>
      <div className="flex gap-0.5">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label={t("datatable.prevPage")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label={t("datatable.nextPage")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
