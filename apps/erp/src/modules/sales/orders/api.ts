/**
 * Orders against `/api/v1/sales/orders/`.
 *
 * Totals are never sent: the backend computes them from the lines and
 * sends them back, so the form shows what will actually be charged.
 *
 * The `Customer` import is real coupling, not laziness — an order
 * carries a trimmed copy of the customer it was issued to, the same way
 * an invoice does.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";
import type { Invoice } from "../invoices/api";

export type OrderStatus = "draft" | "sent" | "accepted" | "cancelled";

export type LineKind = "product" | "section" | "note";

export interface OrderLine {
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

export interface Order {
  uuid: string;
  /** Empty until the order is sent. */
  number: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  issue_date: string;
  valid_until: string;
  status: OrderStatus;
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
  lines: OrderLine[];
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  /** The invoice this order was converted to, if any. */
  converted_invoice: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** One row of the editor's grid. Amounts are absent: the API computes them. */
export interface OrderLineInput {
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

export interface OrderInput {
  customer: string;
  branch?: string;
  issue_date?: string;
  valid_until?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  customer_reference?: string;
  notes?: string;
  terms?: string;
  lines?: OrderLineInput[];
}

export function listOrders(params: ListParams = {}): Promise<Page<Order>> {
  return apiGetPage<Order>(`/v1/sales/orders/?${query(params)}`);
}

export function getOrder(uuid: string) {
  return apiGet<Order>(`/v1/sales/orders/${uuid}/`);
}

export function createOrder(input: OrderInput) {
  return apiPost<Order>("/v1/sales/orders/", input);
}

export function updateOrder(uuid: string, input: Partial<OrderInput>) {
  return apiPatch<Order>(`/v1/sales/orders/${uuid}/`, input);
}

export function deleteOrder(uuid: string) {
  return apiDelete<void>(`/v1/sales/orders/${uuid}/`);
}

/** Issue the order: this is what allocates its number. */
export function sendOrder(uuid: string) {
  return apiPost<Order>(`/v1/sales/orders/${uuid}/send/`);
}

/** The customer said yes. Only a sent order can be accepted. */
export function acceptOrder(uuid: string) {
  return apiPost<Order>(`/v1/sales/orders/${uuid}/accept/`);
}

/** Void a sent or accepted order. The number stays. */
export function cancelOrder(uuid: string) {
  return apiPost<Order>(`/v1/sales/orders/${uuid}/cancel/`);
}

/**
 * Convert an accepted order to a draft invoice, copying its lines.
 * Refused if the order is not accepted, has no product line, or has
 * already been converted (one conversion per order).
 */
export function convertOrderToInvoice(uuid: string) {
  return apiPost<Invoice>(`/v1/sales/orders/${uuid}/convert-to-invoice/`);
}
