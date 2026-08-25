import type { TableStyleProps } from "./types";
import { InvoiceTotals } from "../shared/InvoiceTotals";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";

/**
 * "Bordered" table style — full grid (outer border + vertical dividers
 * between every column), only the Amount column shaded, matching the
 * current Background layout's table exactly (3 columns: Description/
 * Quantity/Amount — no Unit Price or Taxes, per an earlier explicit
 * request on that layout). Ignores `secondaryColor` (headers are plain,
 * not brand-colored). The payment-info/QR content is shared via
 * `InvoicePaymentInfo`; only the wrapper padding (`p-3` vs Light's
 * `pr-3 pt-3`) differs from Light's version.
 */
const neutral = {
  border: "#d1d5db",
  amountBg: "#f4f4f6",
};

export function BorderedTable({
  items,
  totals,
  paymentInfo,
  qrValue,
  accentColor,
}: TableStyleProps) {
  return (
    <div className="overflow-hidden text-[12px]">
      <table
        className="w-full border-collapse border"
        style={{ borderColor: neutral.border }}
      >
        <thead>
          <tr className="border-b" style={{ borderColor: neutral.border }}>
            <th className="px-3 py-2 text-left font-bold">Description</th>
            <th
              className="border-l px-3 py-2 text-right font-bold"
              style={{ borderColor: neutral.border }}
            >
              Quantity
            </th>
            <th
              className="border-l px-3 py-2 text-right font-bold"
              style={{ borderColor: neutral.border }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b"
              style={{ borderColor: neutral.border }}
            >
              <td className="px-3 py-2">{item.description}</td>
              <td
                className="border-l px-3 py-2 text-right"
                style={{ borderColor: neutral.border }}
              >
                {item.quantity.toFixed(2)}
              </td>
              <td
                className="border-l px-3 py-2 text-right"
                style={{ borderColor: neutral.border, backgroundColor: neutral.amountBg }}
              >
                {item.amount.toFixed(2)} {totals.currencySuffix}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex">
        <div className="min-w-0 flex-1 p-3">
          <InvoicePaymentInfo paymentInfo={paymentInfo} qrValue={qrValue} />
        </div>
        <InvoiceTotals
          totals={totals}
          borderColor={neutral.border}
          amountBg={neutral.amountBg}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
