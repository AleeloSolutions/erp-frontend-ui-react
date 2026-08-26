import type { TableStyleProps } from "./types";
import { ledgerHeaderRuleStyle } from "../shared/theme";

/**
 * "Light" table style — minimal/borderless: thin bottom rules only, no
 * vertical dividers, no row shading. Built on the ledger-tick foundation
 * (dot marker + two-tone gradient header rule) like every other style, but
 * stays the most understated of the three.
 */
export function LightTable({ items, currencySuffix }: TableStyleProps) {
  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead>
        <tr style={ledgerHeaderRuleStyle()}>
          <th
            className="pb-[9px] pl-4 text-left text-[10px] font-semibold uppercase tracking-[.07em]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            Description
          </th>
          <th
            className="pb-[9px] text-right text-[10px] font-semibold uppercase tracking-[.07em]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            Quantity
          </th>
          <th
            className="pb-[9px] text-right text-[10px] font-semibold uppercase tracking-[.07em]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            Unit Price
          </th>
          <th
            className="pb-[9px] text-right text-[10px] font-semibold uppercase tracking-[.07em]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            Taxes
          </th>
          <th
            className="pb-[9px] text-right text-[10px] font-semibold uppercase tracking-[.07em]"
            style={{ color: "var(--ls-ink-soft)" }}
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
            style={{ borderColor: "var(--ls-line)" }}
          >
            <td className="ls-ledger-dot py-1 pl-4">{item.description}</td>
            <td className="py-1 text-right">{item.quantity.toFixed(2)}</td>
            <td className="py-1 text-right">{item.unitPrice.toFixed(2)}</td>
            <td className="py-1 text-right">
              {item.taxRate ? (
                <span className="ls-ledger-tag">{item.taxRate}%</span>
              ) : null}
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
