import type { TableStyleProps } from "./types";
import { ledgerHeaderRuleStyle } from "../shared/theme";

/**
 * "Bordered" table style — full grid (outer border + vertical dividers
 * between every column), only the Amount column shaded, matching the
 * current Background layout's table exactly (3 columns: Description/
 * Quantity/Amount — no Unit Price or Taxes, per an earlier explicit
 * request on that layout). Built on the ledger-tick foundation like the
 * other two styles; the outer border/dividers are what keeps it visually
 * distinct from Light and Striped.
 */
export function BorderedTable({ items, currencySuffix }: TableStyleProps) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--ls-line)" }}
    >
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr
            className="border-b"
            style={(ledgerHeaderRuleStyle(), { borderColor: "var(--ls-line)" })}
          >
            <th className="px-3 py-1 text-left text-[10px] font-bold uppercase tracking-[.07em] text-black">
              Description
            </th>
            <th
              className="border-l px-3 py-1 text-right text-[10px] font-bold uppercase tracking-[.07em] text-black"
              style={{ borderColor: "var(--ls-line)" }}
            >
              Quantity
            </th>
            <th
              className="border-l px-3 py-1 text-right text-[10px] font-bold uppercase tracking-[.07em] text-black"
              style={{ borderColor: "var(--ls-line)" }}
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
              <td className="py-1 px-3">{item.description}</td>
              <td
                className="border-l px-3 py-1 text-right"
                style={{ borderColor: "var(--ls-line)" }}
              >
                {item.quantity.toFixed(2)}
              </td>
              <td
                className="border-l px-3 py-1 text-right"
                style={{
                  borderColor: "var(--ls-line)",
                  backgroundColor: "var(--ls-paper-tint)",
                }}
              >
                {item.amount.toFixed(2)} {currencySuffix}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
