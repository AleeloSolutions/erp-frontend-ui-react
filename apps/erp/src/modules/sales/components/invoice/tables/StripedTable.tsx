import type { TableStyleProps } from "./types";
import { InvoiceTotals } from "../shared/InvoiceTotals";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";

/**
 * "Striped" table style — zebra rows, bold colored headers, colored top/
 * bottom rules, matching the current Classic layout's table exactly.
 * `paymentInfo`/`qrValue` sit beside the totals box the same way Light and
 * Bordered do; the totals box itself borrows the zebra stripe color and the
 * layout's secondary color for its border, to stay in the Classic palette.
 * Unlike Light, Unit Price *does* carry the currency suffix here — that's a
 * real difference between the two designs, not an oversight.
 */
const stripeBg = "#f3e8e6";

export function StripedTable({
  items,
  totals,
  paymentInfo,
  qrValue,
  accentColor,
  secondaryColor,
}: TableStyleProps) {
  const lastItemId = items[items.length - 1]?.id;

  return (
    <>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr style={{ borderBottom: `2px solid ${secondaryColor}` }}>
            <th className="py-1.5 text-left font-bold" style={{ color: secondaryColor }}>
              Description
            </th>
            <th className="py-1.5 text-right font-bold" style={{ color: secondaryColor }}>
              Quantity
            </th>
            <th className="py-1.5 text-right font-bold" style={{ color: secondaryColor }}>
              Unit Price
            </th>
            <th className="py-1.5 text-right font-bold" style={{ color: secondaryColor }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: index % 2 === 0 ? stripeBg : undefined,
                borderBottom:
                  item.id === lastItemId ? `2px solid ${secondaryColor}` : undefined,
              }}
            >
              <td className="py-1.5">{item.description}</td>
              <td className="py-1.5 text-right">{item.quantity.toFixed(2)}</td>
              <td className="py-1.5 text-right">
                {item.unitPrice.toFixed(2)} {totals.currencySuffix}
              </td>
              <td className="py-1.5 text-right">
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
          borderColor={secondaryColor ?? accentColor}
          amountBg={stripeBg}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}
