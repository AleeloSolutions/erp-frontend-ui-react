import { Fragment, type ReactNode } from "react";
import { cn } from "../../utils";

export interface DataTableCurrencyTotalsProps {
  /**
   * Currency code → amount as a decimal string.
   *
   * Each currency is rendered on its own. Amounts in different currencies are
   * never added together — there is no exchange rate here and inventing one
   * would print a number that means nothing.
   */
  totals: Record<string, string>;
  /**
   * Renders one currency's amount. Defaults to `CODE amount`; the caller owns
   * symbols, grouping and decimals.
   */
  formatAmount?: (amount: string, currency: string) => ReactNode;
  /** Separator between currencies. */
  separator?: ReactNode;
  className?: string;
}

/**
 * Per-currency totals, e.g. `$1,200.00 · Sh 45,000.00`. Purely presentational:
 * it formats what it is handed and knows nothing about the records behind it.
 */
export function DataTableCurrencyTotals({
  totals,
  formatAmount,
  separator = "·",
  className,
}: DataTableCurrencyTotalsProps) {
  const entries = Object.entries(totals);
  if (entries.length === 0) return null;

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-x-1 tabular-nums", className)}
    >
      {entries.map(([currency, amount], index) => (
        <Fragment key={currency}>
          {index > 0 ? (
            <span className="text-erp-subtle" aria-hidden>
              {separator}
            </span>
          ) : null}
          <span>
            {formatAmount ? formatAmount(amount, currency) : `${currency} ${amount}`}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
