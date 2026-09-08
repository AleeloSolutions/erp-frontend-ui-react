import type { DocumentData } from "../types/document";

/** Plain-text QR payload — no payment backend/URL scheme exists yet to encode a real pay link. */
export function buildDocumentQrValue(data: DocumentData): string {
  const reference = data.invoice.paymentReference ?? data.invoice.number;
  return `Invoice ${data.invoice.number} · ${data.totals.total.toFixed(2)} ${data.totals.currencySuffix} · Ref: ${reference}`;
}
