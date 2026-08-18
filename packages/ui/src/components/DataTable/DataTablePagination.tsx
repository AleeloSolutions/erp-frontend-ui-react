import type { Table } from "@tanstack/react-table";
import { cn } from "../../utils";

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
  serverMode = false,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  const pages = Array.from({ length: pageCount }, (_, index) => index);

  // Cap visible page buttons for large sets
  const visiblePages = (() => {
    if (pageCount <= 7) return pages;
    const set = new Set<number>([0, pageCount - 1, pageIndex]);
    for (let i = pageIndex - 1; i <= pageIndex + 1; i += 1) {
      if (i > 0 && i < pageCount - 1) set.add(i);
    }
    return [...set].sort((a, b) => a - b);
  })();

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-2 border-t border-erp-table-border bg-erp-table-bg px-4 py-2 text-[0.875rem] font-medium text-erp-text",
        className
      )}
    >
      <span>
        Showing {start}–{end} of {totalRows} records
        {serverMode ? " (server)" : ""}
      </span>
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          className="h-7 min-w-7 rounded border border-erp-table-border bg-erp-table-bg px-2 text-[0.8125rem] text-erp-muted disabled:opacity-40"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          Prev
        </button>
        {visiblePages.map((page, index) => {
          const prev = visiblePages[index - 1];
          const showEllipsis = prev != null && page - prev > 1;
          return (
            <span key={page} className="contents">
              {showEllipsis ? (
                <span className="grid h-7 place-items-center px-1">…</span>
              ) : null}
              <button
                type="button"
                className={cn(
                  "h-7 min-w-7 rounded border border-erp-table-border bg-erp-table-bg text-[0.8125rem] text-erp-muted",
                  pageIndex === page &&
                    "border-nav bg-nav text-white hover:border-nav-active hover:bg-nav-active"
                )}
                onClick={() => table.setPageIndex(page)}
                aria-current={pageIndex === page ? "page" : undefined}
              >
                {page + 1}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          className="h-7 min-w-7 rounded border border-erp-table-border bg-erp-table-bg px-2 text-[0.8125rem] text-erp-muted disabled:opacity-40"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
