import { type ReactNode } from "react";
import { cn } from "../../utils";
import { useUiTranslation } from "../../i18n";

export interface DataTableAggregateFooterProps {
  colSpan: number;
  /** Pre-rendered totals for the whole filtered set. */
  totals: ReactNode;
  /** Records in the whole filtered set — not on this page. */
  count?: number;
  /** Overrides the default "Overall total" label. */
  label?: ReactNode;
  className?: string;
}

/**
 * Grand-total footer for the whole filtered set.
 *
 * It is styled apart from the group rows — heavier top rule, uppercase label
 * and an explicit "all records matching the filters" hint — because the number
 * it shows is deliberately *not* the sum of what is on screen.
 */
export function DataTableAggregateFooter({
  colSpan,
  totals,
  count,
  label,
  className,
}: DataTableAggregateFooterProps) {
  const { t } = useUiTranslation("ui");

  return (
    <tfoot className={cn("table-aggregate-footer", className)}>
      <tr>
        <td
          colSpan={colSpan}
          className="!border-t-2 !border-erp-border-strong !bg-erp-table-header !p-0"
        >
          <div className="flex h-11 items-center gap-3 px-4">
            <span className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-erp-text">
              {label ?? t("datatable.overallTotal")}
            </span>
            <span className="ms-auto flex shrink-0 items-center gap-3 text-[14px]">
              <span className="font-semibold tabular-nums text-erp-text">{totals}</span>
              {count != null ? (
                <span className="tabular-nums text-erp-muted">
                  {count} {t("datatable.records")}
                </span>
              ) : null}
            </span>
          </div>
        </td>
      </tr>
    </tfoot>
  );
}
