import type { ReactNode } from "react";
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

/**
 * The pager chrome itself — one implementation, whether the range counts rows
 * or groups.
 */
function PagerView({
  start,
  end,
  total,
  unitLabel,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  className,
}: {
  start: number;
  end: number;
  total: number;
  /** Names what the range counts, e.g. "groups". Omitted for plain rows. */
  unitLabel?: ReactNode;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}) {
  const { t } = useUiTranslation("ui");

  return (
    <div className={cn("flex items-center gap-3 text-[13px] text-erp-text", className)}>
      <span className="whitespace-nowrap tabular-nums">
        {start}-{end} / {total}
        {unitLabel ? <span className="ms-1 text-erp-muted">{unitLabel}</span> : null}
      </span>
      <div className="flex gap-0.5">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          onClick={onPrevious}
          disabled={!canPrevious}
          aria-label={t("datatable.prevPage")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded bg-erp-secondary text-erp-muted hover:bg-erp-secondary-hover disabled:opacity-40"
          onClick={onNext}
          disabled={!canNext}
          aria-label={t("datatable.nextPage")}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function DataTablePagination<TData>({
  table,
  totalRows,
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <PagerView
      start={start}
      end={end}
      total={totalRows}
      canPrevious={table.getCanPreviousPage()}
      canNext={table.getCanNextPage()}
      onPrevious={() => table.previousPage()}
      onNext={() => table.nextPage()}
      className={className}
    />
  );
}

export interface DataTableRangePaginationProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /**
   * Names what the range counts — e.g. "groups" when the pager walks group
   * rows rather than records, so the number is never read as a record count.
   */
  unitLabel?: ReactNode;
  className?: string;
}

/**
 * Pager driven by explicit page numbers instead of a TanStack table — used for
 * anything paged outside the row model, such as a page of server-side groups.
 */
export function DataTableRangePagination({
  page,
  pageSize,
  total,
  onPageChange,
  unitLabel,
  className,
}: DataTableRangePaginationProps) {
  const safePage = Math.max(1, page);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <PagerView
      start={start}
      end={end}
      total={total}
      unitLabel={unitLabel}
      canPrevious={safePage > 1}
      canNext={end < total}
      onPrevious={() => onPageChange(safePage - 1)}
      onNext={() => onPageChange(safePage + 1)}
      className={className}
    />
  );
}
