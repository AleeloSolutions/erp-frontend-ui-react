import type { InvoiceData } from "../types/invoice";

/**
 * The bordered "Untaxed Amount / Tax N% / Total" box — identical between
 * the current Background and Dual designs, so it's shared here. Classic
 * doesn't use this at all today (it only shows a flat Total row styled to
 * match its own striped theme), so it isn't wired to this component.
 */
export interface InvoiceTotalsProps {
  totals: InvoiceData["totals"];
  borderColor: string;
  amountBg: string;
  /** Total row text color — the layout's primary brand color. */
  accentColor: string;
}

function formatAmount(value: number, currencySuffix: string): string {
  return `${value.toFixed(2)} ${currencySuffix}`;
}

export function InvoiceTotals({
  totals,
  borderColor,
  amountBg,
  accentColor,
}: InvoiceTotalsProps) {
  return (
    <div className="w-64 shrink-0 border" style={{ borderColor }}>
      <table className="w-full border-collapse text-[12px]">
        <tbody>
          <tr className="border-b" style={{ borderColor, backgroundColor: amountBg }}>
            <td className="px-3 py-1.5">Untaxed Amount</td>
            <td className="px-3 py-1.5 text-right">
              {formatAmount(totals.untaxedAmount, totals.currencySuffix)}
            </td>
          </tr>
          {totals.taxLines.map((t) => (
            <tr
              key={t.rate}
              className="border-b"
              style={{ borderColor, backgroundColor: amountBg }}
            >
              <td className="px-3 py-1.5">
                Tax {t.rate}% on {formatAmount(t.base, totals.currencySuffix)}
              </td>
              <td className="px-3 py-1.5 text-right">
                {formatAmount(t.tax, totals.currencySuffix)}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: amountBg }}>
            <td className="px-3 py-1.5 font-bold" style={{ color: accentColor }}>
              Total
            </td>
            <td
              className="px-3 py-1.5 text-right font-bold"
              style={{ color: accentColor }}
            >
              {formatAmount(totals.total, totals.currencySuffix)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
