import { Loader2, Plus } from "lucide-react";
import { cn } from "../../utils";
import { useUiTranslation } from "../../i18n";
import { dataTableGroupStateInset } from "./serverGrouping";

export interface DataTableGroupLoadMoreRowProps {
  colSpan: number;
  /** Depth of the group these rows belong to (the rows sit one level in). */
  depth: number;
  /** Rows currently on screen for this group. */
  loaded: number;
  /** Rows the server holds for this group. */
  total: number;
  /**
   * Rows the next request will ask for — sizes the button label. Defaults to
   * the page already delivered, which is the server's page size in practice.
   */
  pageSize?: number;
  /** A request for the next page is in flight. */
  loading?: boolean;
  /**
   * Fetch the next page. Omitted renders the count alone and no button: an
   * honest "showing 25 of 312" is the point, a control nothing services is
   * not.
   */
  onLoadMore?: () => void;
  className?: string;
}

/**
 * The line that closes a partially loaded group.
 *
 * It exists because a header reading "312 items" followed by 25 rows and
 * nothing else is the exact failure this whole mode was built to prevent — a
 * number on screen that looks authoritative and is not.
 *
 * Load-more rather than an in-group pager: a pager would *replace* the rows
 * already read, and at depth 4 there could be a dozen of them on screen at
 * once, each with its own page number to keep track of. Appending keeps the
 * scroll position, keeps the reading order, and keeps the count line literally
 * true about what is above it.
 */
export function DataTableGroupLoadMoreRow({
  colSpan,
  depth,
  loaded,
  total,
  pageSize,
  loading = false,
  onLoadMore,
  className,
}: DataTableGroupLoadMoreRowProps) {
  const { t } = useUiTranslation("ui");
  const remaining = Math.max(total - loaded, 0);
  if (remaining === 0) return null;

  const step = Math.min(
    pageSize && pageSize > 0 ? pageSize : loaded > 0 ? loaded : remaining,
    remaining
  );

  return (
    <tr className={cn("table-group-load-more-row", className)}>
      <td
        colSpan={colSpan}
        className="!border-b !border-erp-table-border !bg-erp-table-bg !p-0"
      >
        <div
          className="flex h-10 items-center gap-3 pe-4"
          style={{ paddingInlineStart: dataTableGroupStateInset(depth) }}
        >
          <span className="shrink-0 text-[13px] tabular-nums text-erp-muted">
            {t("datatable.groupRowsShowing", { loaded, total })}
          </span>
          {onLoadMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              aria-busy={loading || undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded border border-erp-border px-2 py-0.5",
                "text-[13px] font-medium text-erp-primary hover:bg-erp-surface-hover",
                "disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  {t("datatable.groupLoadingMore")}
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {t("datatable.groupLoadMore", { rows: step })}
                </>
              )}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
