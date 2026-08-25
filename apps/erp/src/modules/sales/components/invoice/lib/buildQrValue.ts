import type { InvoiceData } from "../types/invoice";

/** Plain-text QR payload — no payment backend/URL scheme exists yet to encode a real pay link. */
export function buildInvoiceQrValue(data: InvoiceData): string {
  const reference = data.invoice.paymentReference ?? data.invoice.number;
  return `Invoice ${data.invoice.number} · ${data.totals.total.toFixed(2)} ${data.totals.currencySuffix} · Ref: ${reference}`;
}
