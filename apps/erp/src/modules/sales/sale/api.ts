/**
 * Sales against `/api/v1/sales/`, plus their payments.
 *
 * The sale is the only customer-facing document: it is quoted, sent,
 * accepted, and paid against. Totals are never sent: the backend computes
 * them from the lines and sends them back, so the form shows what will
 * actually be charged.
 *
 * The `Customer` import is real coupling, not laziness — a sale
 * carries a trimmed copy of the customer it was issued to.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";

export type SaleStatus = "draft" | "sent" | "accepted" | "cancelled";

/** How far the money has come in; the backend derives it from the payments. */
export type PaymentStatus = "not_paid" | "partially_paid" | "paid" | "overdue";

export type LineKind = "product" | "section" | "note";

export interface SaleLine {
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

export interface Sale {
  uuid: string;
  /** Empty until the sale is sent. */
  number: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  issue_date: string;
  valid_until: string;
  /** When the money falls due; null until the tenant's due days apply. */
  due_date: string | null;
  status: SaleStatus;
  payment_status: PaymentStatus;
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
  lines: SaleLine[];
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** One row of the editor's grid. Amounts are absent: the API computes them. */
export interface SaleLineInput {
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

export interface SalePayment {
  uuid: string;
  amount: string;
  payment_date: string;
  /** The payment method's uuid. */
  payment_method: string;
  reference: string;
  notes: string;
  /** Set once the payment is reversed; a voided row stays on file. */
  voided_at: string | null;
  created_at: string;
}

/** What recording a payment asks for; the rest the backend fills in. */
export interface SalePaymentInput {
  amount: string;
  payment_method: string;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

export interface SaleInput {
  customer: string;
  branch?: string;
  issue_date?: string;
  valid_until?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  customer_reference?: string;
  notes?: string;
  terms?: string;
  lines?: SaleLineInput[];
}

export function listSales(params: ListParams = {}): Promise<Page<Sale>> {
  return apiGetPage<Sale>(`/v1/sales/?${query(params)}`);
}

export function getSale(uuid: string) {
  return apiGet<Sale>(`/v1/sales/${uuid}/`);
}

export function createSale(input: SaleInput) {
  return apiPost<Sale>("/v1/sales/", input);
}

export function updateSale(uuid: string, input: Partial<SaleInput>) {
  return apiPatch<Sale>(`/v1/sales/${uuid}/`, input);
}

export function deleteSale(uuid: string) {
  return apiDelete<void>(`/v1/sales/${uuid}/`);
}

/** Issue the sale: this is what allocates its number. */
export function sendSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/send/`);
}

/** The customer said yes. Only a sent sale can be accepted. */
export function acceptSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/accept/`);
}

/** Void a sent or accepted sale. The number stays. */
export function cancelSale(uuid: string) {
  return apiPost<Sale>(`/v1/sales/${uuid}/cancel/`);
}

/** Every payment filed against this sale, voided rows included. */
export function listSalePayments(uuid: string) {
  return apiGet<SalePayment[]>(`/v1/sales/${uuid}/payments/`);
}

/** Recording a payment moves the sale's balance, so the sale comes back. */
export function recordSalePayment(uuid: string, input: SalePaymentInput) {
  return apiPost<Sale>(`/v1/sales/${uuid}/payments/`, input);
}

/** Reverse a payment. The row stays; the balance goes back up. */
export function voidSalePayment(uuid: string, paymentUuid: string) {
  return apiDelete<Sale>(`/v1/sales/${uuid}/payments/${paymentUuid}/`);
}
