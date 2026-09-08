/**
 * Transport shared by every sales entity: the list-parameter shape each
 * server-side list takes, the query-string builder behind it, and the
 * tenant configuration (taxes, payment methods) that more than one
 * document type reads.
 *
 * Entity-specific calls live in that entity's own `api.ts`.
 */

import { apiGetPage } from "@/lib/api-client";

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

export interface PaymentMethod {
  uuid: string;
  name: string;
  method_type: string;
  is_default: boolean;
  is_archived: boolean;
}

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

export function listPaymentMethods() {
  return apiGetPage<PaymentMethod>("/v1/sales/payment-methods/?page_size=100");
}
