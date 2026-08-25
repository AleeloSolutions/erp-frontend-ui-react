import type { InvoiceData, InvoiceItem } from "../types/invoice";

export interface TableStylePaymentInfo {
  paymentTerms?: string;
  paymentReference?: string;
  accountNumber?: string;
}

/**
 * Common contract every table-style component implements, so the registry
 * can type them uniformly. Not every style uses every field — e.g. Light
 * and Bordered ignore `secondaryColor` (their borders are a fixed neutral,
 * not brand-colored).
 */
export interface TableStyleProps {
  items: InvoiceItem[];
  totals: InvoiceData["totals"];
  /** Brand primary — Total-row emphasis in every style. */
  accentColor: string;
  /** Brand secondary — header text/border accents (Striped only, so far). */
  secondaryColor?: string;
  /** Shown beside the totals box, in every table style. */
  paymentInfo?: TableStylePaymentInfo;
  /** Rendered beside the "scan to pay" message under `paymentInfo`, in every table style. */
  qrValue?: string;
}
