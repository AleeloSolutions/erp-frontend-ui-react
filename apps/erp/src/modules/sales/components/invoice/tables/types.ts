import type { InvoiceItem } from "../types/invoice";

export interface TableStylePaymentInfo {
  paymentTerms?: string;
  paymentReference?: string;
  accountNumber?: string;
}

/**
 * Common contract every table-style component implements, so the registry
 * can type them uniformly. Line-items only as of the Ledger Seal pass —
 * totals and payment-terms/QR now render once per layout via the shared
 * `InvoiceStub`/`InvoicePaymentInfo` "foot-row" (see each layout), not
 * inside the table, so every layout × table-style combination shows the
 * exact same totals treatment instead of three slightly different ones.
 */
export interface TableStyleProps {
  items: InvoiceItem[];
  currencySuffix: string;
  /** Brand primary — the ledger-tick header rule's gradient start, in every style. */
  accentColor: string;
  /** Brand secondary — header rule's gradient end / dot marker color. */
  secondaryColor?: string;
}
