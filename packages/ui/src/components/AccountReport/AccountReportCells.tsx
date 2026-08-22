import { MoreVertical } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatReportAmount } from "../../utils/format";
import type {
  AccountReportLineRow,
  AccountReportRowHandlers,
} from "./accountReport.types";
import {
  amountClassName,
  hasAmountValue,
  isAmountMuted,
  labelClassName,
  levelPaddingClass,
} from "./accountReport.utils";

/** Sized by `--report-fold-size`; the empty variant keeps unfoldable rows aligned. */
const FOLD_GUTTER_CLASS = "inline-flex shrink-0 items-center justify-center";

/** Same CSS triangle as `Dropdown` caret — teal when open, subtle when closed. */
function AccountReportFoldCaret({ expanded }: { expanded?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-0 border-x-[4px] border-x-transparent border-t-[5px] border-solid transition-[transform,border-color] duration-150",
        expanded ? "border-t-erp-primary" : "-rotate-90 border-t-erp-subtle"
      )}
    />
  );
}

type LabelCellProps = Pick<AccountReportRowHandlers, "onLabelClick" | "onRowAction"> & {
  row: AccountReportLineRow;
  onToggleExpanded: (rowId: string) => void;
};

/** Fold gutter + label. A `labelLink` row renders a drill-down button instead of text. */
export function AccountReportLabelCell({
  row,
  onToggleExpanded,
  onLabelClick,
  onRowAction,
}: LabelCellProps) {
  return (
    <td
      data-id="line_name"
      className={cn(
        "line_name border-x-0 border-t-0 align-middle",
        levelPaddingClass(row.level, row.detail),
        row.unfoldable && "unfoldable"
      )}
    >
      <div className="wrapper flex items-center">
        {row.unfoldable ? (
          <button
            type="button"
            data-id="btn_foldable"
            className={cn(
              FOLD_GUTTER_CLASS,
              "btn_foldable border-0 bg-transparent p-0 hover:opacity-80"
            )}
            aria-expanded={row.unfolded}
            aria-label={row.unfolded ? "Collapse" : "Expand"}
            onClick={() => onToggleExpanded(row.id)}
          >
            <AccountReportFoldCaret expanded={row.unfolded} />
          </button>
        ) : (
          <span
            className={cn(FOLD_GUTTER_CLASS, "btn_foldable_empty")}
            aria-hidden="true"
          />
        )}

        {row.labelLink ? (
          <button
            type="button"
            className="clickable cursor-pointer border-0 bg-transparent p-0 text-start font-normal text-erp-report-text hover:underline"
            onClick={() => onLabelClick?.(row.id)}
          >
            {row.label}
          </button>
        ) : (
          <div data-id="content" className="content flex min-w-0 items-center gap-0.5">
            <div className={labelClassName(row)}>{row.label}</div>
            {row.showActions && onRowAction ? (
              <button
                type="button"
                className="inline-flex shrink-0 border-0 bg-transparent p-0 text-erp-subtle hover:text-erp-report-text"
                aria-label="Row actions"
                onClick={() => onRowAction(row.id)}
              >
                <MoreVertical className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </td>
  );
}

type AmountCellProps = Pick<AccountReportRowHandlers, "onAmountClick"> & {
  row: AccountReportLineRow;
  columnKey: string;
  locale: string;
};

/** One numeric column for a line. Renders an empty cell when the line has no figure. */
export function AccountReportAmountCell({
  row,
  columnKey,
  locale,
  onAmountClick,
}: AmountCellProps) {
  const rawAmount = row.amounts?.[columnKey];
  const hasAmount = hasAmountValue(rawAmount);
  const muted = hasAmount && isAmountMuted(row, rawAmount);

  return (
    <td
      data-id="line_cell"
      data-expression_label={columnKey}
      className={cn(
        "line_cell auditable numeric border-x-0 border-t-0 text-end align-middle tabular-nums",
        muted && "muted"
      )}
    >
      <div className="wrapper flex items-center justify-end">
        {hasAmount ? (
          <div className="content">
            {onAmountClick ? (
              <button
                type="button"
                className={cn(
                  "cursor-pointer border-0 bg-transparent p-0 hover:underline",
                  amountClassName(row, muted)
                )}
                onClick={() => onAmountClick(row.id, columnKey)}
              >
                {formatReportAmount(rawAmount, locale)}
              </button>
            ) : (
              <div className={amountClassName(row, muted)}>
                {formatReportAmount(rawAmount, locale)}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </td>
  );
}
