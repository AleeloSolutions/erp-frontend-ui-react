import type { TableStyleProps } from "./types";
import { ledgerHeaderRuleStyle } from "../shared/theme";

/**
 * "Striped" table style — zebra rows with brand-colored header text, built
 * on the same ledger-tick foundation (dot marker + gradient header rule) as
 * Light and Bordered. Unlike Light, Unit Price *does* carry the currency
 * suffix here — that's a real difference between the two designs, not an
 * oversight.
 */
export function StripedTable({ items, currencySuffix }: TableStyleProps) {
  const lastItemId = items[items.length - 1]?.id;

  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead>
        <tr style={ledgerHeaderRuleStyle()}>
          <th className="pb-[9px] pl-4 text-left text-[10px] font-bold uppercase tracking-[.07em] text-black">
            Description
          </th>
          <th className="pb-[9px] text-right text-[10px] font-bold uppercase tracking-[.07em] text-black">
            Quantity
          </th>
          <th className="pb-[9px] text-right text-[10px] font-bold uppercase tracking-[.07em] text-black">
            Unit Price
          </th>
          <th className="pb-[9px] text-right text-[10px] font-bold uppercase tracking-[.07em] text-black">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr
            key={item.id}
            style={{
              backgroundColor: index % 2 === 0 ? "var(--ls-paper-tint)" : undefined,
              borderBottom:
                item.id === lastItemId ? "1px solid var(--ls-line)" : undefined,
            }}
          >
            <td className="py-1 pl-4">{item.description}</td>
            <td className="py-1 text-right">{item.quantity.toFixed(2)}</td>
            <td className="py-1 text-right">
              {item.unitPrice.toFixed(2)} {currencySuffix}
            </td>
            <td className="py-1 text-right">
              {item.amount.toFixed(2)} {currencySuffix}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
