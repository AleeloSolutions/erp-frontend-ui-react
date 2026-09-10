/**
 * Transport shared by every sales entity: the list-parameter shape each
 * server-side list takes, the query-string builder behind it, and the
 * tenant configuration (taxes, payment methods, invoicing defaults) that
 * more than one document type reads.
 *
 * Entity-specific calls live in that entity's own `api.ts`.
 */

import { apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";

export interface BranchRef {
  uuid: string;
  name: string;
  code: string;
}

export interface ListParams {
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
  /** Extra server-side filters, e.g. `{ status: "draft" }`. */
  filters?: Record<string, string>;
}

export interface SalesTax {
  uuid: string;
  name: string;
  rate: string;
  is_default: boolean;
  is_archived: boolean;
}

export type SalesTaxInput = {
  name: string;
  rate: string;
  is_default?: boolean;
  is_archived?: boolean;
};

export type PaymentMethodType = "cash" | "bank" | "mobile_money" | "card" | "other";

export interface PaymentMethod {
  uuid: string;
  name: string;
  method_type: PaymentMethodType | string;
  account_name: string;
  account_number: string;
  instructions: string;
  is_default: boolean;
  is_archived: boolean;
}

export type PaymentMethodInput = {
  name: string;
  method_type: PaymentMethodType;
  account_name?: string;
  account_number?: string;
  instructions?: string;
  is_default?: boolean;
  is_archived?: boolean;
};

export interface SalesSettings {
  uuid: string;
  invoice_prefix: string;
  quotation_prefix: string;
  has_branch_in_number: boolean;
  number_padding: number;
  default_due_days: number;
  default_valid_days: number;
  /** Tax uuid, or null when none is set. */
  default_tax: string | null;
  invoice_terms: string;
  invoice_footer: string;
  quotation_terms: string;
  updated_at: string;
}

export type SalesSettingsInput = Partial<{
  invoice_prefix: string;
  quotation_prefix: string;
  has_branch_in_number: boolean;
  number_padding: number;
  default_due_days: number;
  default_valid_days: number;
  default_tax: string | null;
  invoice_terms: string;
  invoice_footer: string;
  quotation_terms: string;
}>;

/** Shared so each entity builds identical list URLs. */
export function query(params: ListParams): string {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 25),
  });
  if (params.ordering) search.set("ordering", params.ordering);
  if (params.search) search.set("search", params.search);
  for (const [key, value] of Object.entries(params.filters ?? {})) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export function listTaxes() {
  return apiGetPage<SalesTax>("/v1/sales/taxes/?page_size=100");
}

export function createTax(input: SalesTaxInput) {
  return apiPost<SalesTax>("/v1/sales/taxes/", input);
}

export function updateTax(uuid: string, input: Partial<SalesTaxInput>) {
  return apiPatch<SalesTax>(`/v1/sales/taxes/${uuid}/`, input);
}

export function listPaymentMethods() {
  return apiGetPage<PaymentMethod>("/v1/sales/payment-methods/?page_size=100");
}

export function createPaymentMethod(input: PaymentMethodInput) {
  return apiPost<PaymentMethod>("/v1/sales/payment-methods/", input);
}

export function updatePaymentMethod(uuid: string, input: Partial<PaymentMethodInput>) {
  return apiPatch<PaymentMethod>(`/v1/sales/payment-methods/${uuid}/`, input);
}

export function getSalesSettings() {
  return apiGet<SalesSettings>("/v1/sales/settings/");
}

export function updateSalesSettings(input: SalesSettingsInput) {
  return apiPatch<SalesSettings>("/v1/sales/settings/", input);
}
