/**
 * The invoice editor's own shape, and the translation to and from the API.
 *
 * Deliberately not the API's shape: a row being typed has no uuid yet, and
 * no amount either — `subtotal_amount`, `tax_amount`, `total_amount` and
 * the rest are computed by the server from what is sent, so the editor
 * never holds a total it could disagree with.
 *
 * Quantities and prices stay strings the whole way. They are decimals on
 * the backend, and parsing "0.1" into a float here is how a cent goes
 * missing between the screen and the ledger.
 */

import { z } from "zod";
import type {
  InvoiceLine,
  InvoiceLineInput,
  InvoiceStatus,
  LineKind,
  PaymentState,
} from "./api";
export const invoiceFormSchema = z.object({
  /** A customer uuid — the API resolves nothing by name. */
  customer: z.string().min(1, "Customer is required"),
  issue_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.string(),
  customer_reference: z.string(),
  notes: z.string(),
  terms: z.string(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  posted: "Posted",
  cancelled: "Cancelled",
};

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  not_paid: "Not Paid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** `issue_date` plus the customer's agreed terms — the default due date. */
export function dueDateFrom(issueDate: string, paymentTermsDays: number): string {
  const date = new Date(`${issueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return issueDate;
  date.setDate(date.getDate() + paymentTermsDays);
  return date.toISOString().slice(0, 10);
}

export function emptyInvoiceForm(): InvoiceFormValues {
  return {
    customer: "",
    issue_date: todayIso(),
    due_date: todayIso(),
    discount_type: "percentage",
    discount_value: "0",
    customer_reference: "",
    notes: "",
    terms: "",
  };
}

export interface InvoiceLineFormValue {
  /** The line's uuid once saved, a local key until then — the grid needs one either way. */
  id: string;
  /** `section` / `note` rows merge into a single free-text cell (Odoo-style). */
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  /** A tax uuid, or null when the line is untaxed or is not a product row. */
  tax: string | null;
}

let nextLineId = 1;

export function createEmptyInvoiceLine(tax: string | null = null): InvoiceLineFormValue {
  return {
    id: `new-${nextLineId++}`,
    kind: "product",
    description: "",
    quantity: "1",
    unit_price: "0",
    tax,
  };
}

export function createInvoiceSectionLine(): InvoiceLineFormValue {
  return { ...createEmptyInvoiceLine(), kind: "section" };
}

export function createInvoiceNoteLine(): InvoiceLineFormValue {
  return { ...createEmptyInvoiceLine(), kind: "note" };
}

/** A saved invoice's lines, back into rows the grid can edit. */
export function toFormLines(lines: InvoiceLine[]): InvoiceLineFormValue[] {
  return lines.map((line) => ({
    id: line.uuid,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    tax: line.tax,
  }));
}

/**
 * What the grid sends back. Empty rows are dropped, and a section or note
 * carries no money — it is a heading, not a charge.
 */
export function toLineInputs(lines: InvoiceLineFormValue[]): InvoiceLineInput[] {
  return lines
    .filter((line) => line.description.trim().length > 0)
    .map((line) =>
      line.kind === "product"
        ? {
            kind: line.kind,
            description: line.description.trim(),
            quantity: line.quantity || "0",
            unit_price: line.unit_price || "0",
            tax: line.tax,
          }
        : {
            kind: line.kind,
            description: line.description.trim(),
            quantity: "0",
            unit_price: "0",
            tax: null,
          }
    );
}

export function hasChargeableLine(lines: InvoiceLineFormValue[]): boolean {
  return lines.some(
    (line) => line.kind === "product" && line.description.trim().length > 0
  );
}

/**
 * The editor's own guess at a row's amount, shown only while the draft is
 * being typed. The server recomputes every total on save and its numbers
 * replace these — this result is never sent back.
 */
export function estimateLineAmount(line: InvoiceLineFormValue): number {
  if (line.kind !== "product") return 0;
  return (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
}

/** Provisional untaxed total, on the same terms as `estimateLineAmount`. */
export function estimateUntaxedTotal(lines: InvoiceLineFormValue[]): number {
  return lines.reduce((sum, line) => sum + estimateLineAmount(line), 0);
}

/**
 * Amounts arrive as decimal strings and are rendered exactly as sent.
 * `formatCurrency` wants a number, and turning the server's decimal into
 * one only to print it risks showing a figure the ledger does not hold.
 */
export function formatMoney(amount: string, currency: string): string {
  return currency ? `${amount} ${currency}` : amount;
}
