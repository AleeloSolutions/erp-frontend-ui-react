/**
 * Contracts against `/api/v1/sales/contracts/`.
 *
 * Header-only (v1): no lines, no document number. A contract is filed,
 * edited, and archived once its term ends -- the same "own records"
 * shape as a customer, not the numbered-document shape of an invoice.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";
import type { Customer } from "../customers/api";

export type ContractStatus = "draft" | "active" | "expired";

export interface Contract {
  uuid: string;
  name: string;
  customer: Pick<Customer, "uuid" | "name" | "email" | "phone" | "currency">;
  branch: BranchRef | null;
  start_date: string;
  end_date: string;
  value_amount: string;
  status: ContractStatus;
  notes: string;
  salesperson_name: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractInput {
  customer: string;
  branch?: string;
  name: string;
  start_date: string;
  end_date: string;
  value_amount?: string;
  status?: ContractStatus;
  notes?: string;
}

export function listContracts(params: ListParams = {}): Promise<Page<Contract>> {
  return apiGetPage<Contract>(`/v1/sales/contracts/?${query(params)}`);
}

export function getContract(uuid: string) {
  return apiGet<Contract>(`/v1/sales/contracts/${uuid}/`);
}

export function createContract(input: ContractInput) {
  return apiPost<Contract>("/v1/sales/contracts/", input);
}

export function updateContract(uuid: string, input: Partial<ContractInput>) {
  return apiPatch<Contract>(`/v1/sales/contracts/${uuid}/`, input);
}

export function deleteContract(uuid: string) {
  return apiDelete<void>(`/v1/sales/contracts/${uuid}/`);
}
