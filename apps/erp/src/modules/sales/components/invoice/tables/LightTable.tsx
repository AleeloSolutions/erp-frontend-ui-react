import type { TableStyleProps } from "./types";
import { InvoiceTotals } from "../shared/InvoiceTotals";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";

/**
 * "Light" table style — plain rows (thin bottom rule only, no vertical
 * dividers, no shading), matching the current Dual layout's table exactly.
 * The neutral border/shading colors are intrinsic to what "Light" means,
 * not passed in — a different table style owns its own color language the
 * same way. Ignores `secondaryColor` (no header/border accent to color).
 */
const neutral = {
  border: "#d1d5db",
  amountBg: "#f4f4f6",
};

export function LightTable({
  items,
  totals,
  paymentInfo,
  qrValue,
  accentColor,
}: TableStyleProps) {
  return (
    <>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b" style={{ borderColor: neutral.border }}>
            <th className="py-2 text-left font-bold">Description</th>
            <th className="py-2 text-right font-bold">Quantity</th>
            <th className="py-2 text-right font-bold">Unit Price</th>
            <th className="py-2 text-right font-bold">Taxes</th>
            <th className="py-2 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b"
              style={{ borderColor: neutral.border }}
            >
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity.toFixed(2)}</td>
              <td className="py-2 text-right">{item.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right">
                {item.taxRate ? `${item.taxRate}%` : ""}
              </td>
              <td className="py-2 text-right">
                {item.amount.toFixed(2)} {totals.currencySuffix}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex">
        <div className="min-w-0 flex-1 pr-3 pt-3 text-[12px]">
          <InvoicePaymentInfo paymentInfo={paymentInfo} qrValue={qrValue} />
        </div>
        <InvoiceTotals
          totals={totals}
          borderColor={neutral.border}
          amountBg={neutral.amountBg}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}
