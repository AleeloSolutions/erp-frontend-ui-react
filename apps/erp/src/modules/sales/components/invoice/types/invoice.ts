/**
 * Shared types for the invoice document layout system.
 *
 * `InvoiceData` never contains styling; `InvoiceSettings` never contains
 * business data. Layout/table components only ever receive already-prepared
 * data — no tax math, no total calculation inside presentation components.
 *
 * Field shapes below were adjusted from the prompt's starting sketch to
 * match what the three existing print documents (Classic/"Center",
 * Background/"Bubble", DualHeader/"Dual") actually render today — see the
 * inline notes on the fields that differ from the sketch.
 */

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /**
   * Percent, e.g. 15 for 15%. Omitted or 0 = untaxed line — matches the
   * `taxRate` already used by the real invoice line schema
   * (`invoices/schema.ts`), not invented for this system.
   */
  taxRate?: number;
  /** `quantity * unitPrice`, pre-computed — layouts must not recompute this. */
  amount: number;
}

/** One row of the totals-box tax breakdown, e.g. "Tax 15% on 91.00 Sh." */
export interface InvoiceTaxLine {
  rate: number;
  /** Sum of `amount` across every item taxed at this rate. */
  base: number;
  tax: number;
}

export interface InvoiceData {
  company: {
    name: string;
    logoUrl?: string;
    /**
     * Single line, e.g. "Somalia" — every current layout renders one line,
     * not the sketch's implied multi-line address.
     */
    address?: string;
    taxId?: string;
  };
  customer: {
    name: string;
    /** Shown big and bold in the footer on all three current layouts. */
    email?: string;
  };
  invoice: {
    number: string;
    date: string;
    dueDate?: string;
    /** "Payment terms: 15 Days" — Background/Dual only; Classic has no equivalent line. */
    paymentTerms?: string;
    /**
     * "Payment Communication: {value}" — a real, independently-settable
     * field on the invoice form (`invoiceFormSchema.paymentReference`), not
     * always equal to `number`. Every current print layout falls back to
     * `number` when this is unset, since none of them wire the real field
     * in yet.
     */
    paymentReference?: string;
    /** "on this account: {value}" — Background/Dual only. */
    accountNumber?: string;
    /** Classic only; currently rendered nowhere (commented out in that component). */
    notes?: string;
  };
  items: InvoiceItem[];
  totals: {
    untaxedAmount: number;
    /**
     * One entry per distinct tax rate present on `items`. The sketch had a
     * single flat `taxAmount`/`taxLabel` pair, but Background and Dual
     * already render a separate "Tax N% on X" row per rate — a single pair
     * can't represent an invoice with two different tax rates on it.
     * Classic doesn't render any tax breakdown at all (empty array).
     */
    taxLines: InvoiceTaxLine[];
    total: number;
    /**
     * Appended *after* the formatted amount (e.g. "10.00 Sh."), not a
     * prefixed symbol like "$10.00" — matches every current layout's
     * `formatShillings` helper. Renamed from the sketch's `currencySymbol`
     * to reflect that.
     */
    currencySuffix: string;
  };
}

// Left as string-literal unions rather than a stricter/branded type so a
// future layout/table style doesn't require touching every consumer.
export type LayoutKey = "center" | "bubble" | "dual";
// "bordered" was added during the Bubble refactor: Background's real table
// (outer border + vertical dividers, shaded Amount column) matches neither
// Classic's zebra-stripe nor Dual's borderless thin-rule table pixel-for-
// pixel — confirmed with the user rather than forcing it into either.
export type TableStyleKey = "striped" | "light" | "bordered";

export interface InvoiceSettings {
  layout: LayoutKey;
  tableStyle: TableStyleKey;
  font: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  address?: string;
  tagline?: string;
  footerText?: string;
  paperFormat: "A4" | "Letter";
  taxId?: string;
  /**
   * Company-level bank account shown on Dual/Bubble's "on this account"
   * line. Takes priority over `InvoiceData.invoice.accountNumber` when set,
   * so editing it in the layout panel is immediately visible in the preview
   * regardless of what a specific invoice's own data carries.
   */
  bankAccount?: string;
  showQrCode: boolean;
}
