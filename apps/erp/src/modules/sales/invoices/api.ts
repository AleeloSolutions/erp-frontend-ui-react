/**
 * Invoices against `/api/v1/sales/invoices/`, plus their payments.
 *
 * Totals are never sent: the backend computes them from the lines and
 * sends them back, so the form shows what will actually be charged.
 *
 * The `Customer` import is real coupling, not laziness — an invoice
 * carries a trimmed copy of the customer it was issued to.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";

export type InvoiceStatus = "draft" | "posted" | "cancelled";

export type PaymentState = "not_paid" | "partially_paid" | "paid" | "overdue";

export type LineKind = "product" | "section" | "note";

export interface InvoiceLine {
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

export interface Invoice {
  uuid: string;
  /** Empty until the invoice is posted. */
  number: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  payment_status: PaymentState;
  currency: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  customer_reference: string;
  notes: string;
  terms: string;
  salesperson_name: string | null;
  lines: InvoiceLine[];
  posted_at: string | null;
  cancelled_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** One row of the editor's grid. Amounts are absent: the API computes them. */
export interface InvoiceLineInput {
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

export interface InvoiceInput {
  customer: string;
  branch?: string;
  issue_date?: string;
  due_date?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  customer_reference?: string;
  notes?: string;
  terms?: string;
  lines?: InvoiceLineInput[];
}

export interface InvoicePayment {
  uuid: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string;
  notes: string;
  voided_at: string | null;
  created_at: string;
}

export function listInvoices(params: ListParams = {}): Promise<Page<Invoice>> {
  return apiGetPage<Invoice>(`/v1/sales/invoices/?${query(params)}`);
}

export function getInvoice(uuid: string) {
  return apiGet<Invoice>(`/v1/sales/invoices/${uuid}/`);
}

export function createInvoice(input: InvoiceInput) {
  return apiPost<Invoice>("/v1/sales/invoices/", input);
}

export function updateInvoice(uuid: string, input: Partial<InvoiceInput>) {
  return apiPatch<Invoice>(`/v1/sales/invoices/${uuid}/`, input);
}

export function deleteInvoice(uuid: string) {
  return apiDelete<void>(`/v1/sales/invoices/${uuid}/`);
}

/** Issue the invoice: this is what allocates its number. */
export function postInvoice(uuid: string) {
  return apiPost<Invoice>(`/v1/sales/invoices/${uuid}/post/`);
}

/** Void a posted invoice. The number stays; a gap is what an auditor expects. */
export function cancelInvoice(uuid: string) {
  return apiPost<Invoice>(`/v1/sales/invoices/${uuid}/cancel/`);
}

export function listPayments(uuid: string) {
  return apiGet<InvoicePayment[]>(`/v1/sales/invoices/${uuid}/payments/`);
}

export function recordPayment(
  uuid: string,
  input: {
    amount: string;
    payment_method: string;
    payment_date?: string;
    reference?: string;
  }
) {
  return apiPost<Invoice>(`/v1/sales/invoices/${uuid}/payments/`, input);
}

export function voidPayment(invoiceUuid: string, paymentUuid: string) {
  return apiDelete<Invoice>(`/v1/sales/invoices/${invoiceUuid}/payments/${paymentUuid}/`);
}
