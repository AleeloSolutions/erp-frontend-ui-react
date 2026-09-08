/**
 * Customers against `/api/v1/sales/customers/`.
 *
 * Addressed by `uuid` — the API exposes no `id` — and every list is
 * paginated, searched, sorted and filtered server-side.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";

export type CustomerType = "organization" | "person";

export interface Customer {
  uuid: string;
  customer_type: CustomerType;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  tax_number: string;
  currency: string;
  payment_terms_days: number;
  /** null = no credit limit, which is a real state, not a missing value. */
  credit_limit: string | null;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  full_address: string;
  notes: string;
  branch: BranchRef | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Partial<
  Omit<Customer, "uuid" | "branch" | "full_address" | "created_at" | "updated_at">
> & { branch_uuid?: string };

export function listCustomers(params: ListParams = {}): Promise<Page<Customer>> {
  return apiGetPage<Customer>(`/v1/sales/customers/?${query(params)}`);
}

export function getCustomer(uuid: string) {
  return apiGet<Customer>(`/v1/sales/customers/${uuid}/`);
}

export function createCustomer(input: CustomerInput) {
  return apiPost<Customer>("/v1/sales/customers/", input);
}

export function updateCustomer(uuid: string, input: CustomerInput) {
  return apiPatch<Customer>(`/v1/sales/customers/${uuid}/`, input);
}

export function deleteCustomer(uuid: string) {
  return apiDelete<void>(`/v1/sales/customers/${uuid}/`);
}
