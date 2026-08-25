import type { InvoiceItem, InvoiceTaxLine } from "../types/invoice";

/**
 * Pure tax/total calculation — the "shared place" the architecture's core
 * principle requires this logic to live, instead of inside a layout or
 * table component. Called once, upstream of rendering, to produce
 * `InvoiceData["totals"]`.
 */
export function computeInvoiceTotals(
  items: InvoiceItem[],
  currencySuffix: string
): {
  untaxedAmount: number;
  taxLines: InvoiceTaxLine[];
  total: number;
  currencySuffix: string;
} {
  const untaxedAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const taxGroups = new Map<number, number>();
  for (const item of items) {
    if (!item.taxRate) continue;
    taxGroups.set(item.taxRate, (taxGroups.get(item.taxRate) ?? 0) + item.amount);
  }
  const taxLines: InvoiceTaxLine[] = Array.from(taxGroups.entries()).map(
    ([rate, base]) => ({
      rate,
      base,
      tax: base * (rate / 100),
    })
  );

  const total = untaxedAmount + taxLines.reduce((sum, t) => sum + t.tax, 0);

  return { untaxedAmount, taxLines, total, currencySuffix };
}
