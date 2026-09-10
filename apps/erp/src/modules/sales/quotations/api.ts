/**
 * Quotations against `/api/v1/sales/quotations/`.
 *
 * Totals are never sent: the backend computes them from the lines and
 * sends them back, so the form shows what will actually be charged.
 *
 * The `Customer` import is real coupling, not laziness — a quotation
 * carries a trimmed copy of the customer it was issued to, the same way
 * an invoice does.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";
import type { Invoice } from "../invoices/api";

export type QuotationStatus = "draft" | "sent" | "accepted" | "cancelled";

export type LineKind = "product" | "section" | "note";

export interface QuotationLine {
  uuid: string;
  position: number;
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  /** The tax's uuid; null on a section or note row. */
  tax: string | null;
  /** What the rate was worth the day it was charged, not what it is now. */
  tax_rate: string;
  line_subtotal: string;
  line_tax_amount: string;
  line_total: string;
}

export interface Quotation {
  uuid: string;
  /** Empty until the quotation is sent. */
  number: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  issue_date: string;
  valid_until: string;
  status: QuotationStatus;
  currency: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  customer_reference: string;
  notes: string;
  terms: string;
  salesperson_name: string | null;
  lines: QuotationLine[];
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  /** The invoice this quotation was converted to, if any. */
  converted_invoice: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** One row of the editor's grid. Amounts are absent: the API computes them. */
export interface QuotationLineInput {
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

export interface QuotationInput {
  customer: string;
  branch?: string;
  issue_date?: string;
  valid_until?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  customer_reference?: string;
  notes?: string;
  terms?: string;
  lines?: QuotationLineInput[];
}

export function listQuotations(params: ListParams = {}): Promise<Page<Quotation>> {
  return apiGetPage<Quotation>(`/v1/sales/quotations/?${query(params)}`);
}

export function getQuotation(uuid: string) {
  return apiGet<Quotation>(`/v1/sales/quotations/${uuid}/`);
}

export function createQuotation(input: QuotationInput) {
  return apiPost<Quotation>("/v1/sales/quotations/", input);
}

export function updateQuotation(uuid: string, input: Partial<QuotationInput>) {
  return apiPatch<Quotation>(`/v1/sales/quotations/${uuid}/`, input);
}

export function deleteQuotation(uuid: string) {
  return apiDelete<void>(`/v1/sales/quotations/${uuid}/`);
}

/** Issue the quotation: this is what allocates its number. */
export function sendQuotation(uuid: string) {
  return apiPost<Quotation>(`/v1/sales/quotations/${uuid}/send/`);
}

/** The customer said yes. Only a sent quotation can be accepted. */
export function acceptQuotation(uuid: string) {
  return apiPost<Quotation>(`/v1/sales/quotations/${uuid}/accept/`);
}

/** Void a sent or accepted quotation. The number stays. */
export function cancelQuotation(uuid: string) {
  return apiPost<Quotation>(`/v1/sales/quotations/${uuid}/cancel/`);
}

/**
 * Convert an accepted quotation to a draft invoice, copying its lines.
 * Refused if the quotation is not accepted, has no product line, or has
 * already been converted (one conversion per quotation).
 */
export function convertQuotationToInvoice(uuid: string) {
  return apiPost<Invoice>(`/v1/sales/quotations/${uuid}/convert-to-invoice/`);
}
