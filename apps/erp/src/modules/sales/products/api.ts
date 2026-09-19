/**
 * Products against `/api/v1/sales/products/`.
 *
 * MVP catalogue: name required; code / unit_price / tax optional.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import type { ApiFetchOptions, Page } from "@/lib/api-client";
import { query, type BranchRef, type ListParams } from "../shared/api";

export interface Product {
  uuid: string;
  name: string;
  code: string;
  unit_price: string;
  default_tax: string | null;
  branch: BranchRef | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Partial<
  Omit<Product, "uuid" | "branch" | "created_at" | "updated_at">
> & { branch_uuid?: string };

/** `init` carries the picker's AbortSignal — see `listCustomers`. */
export function listProducts(
  params: ListParams = {},
  init?: ApiFetchOptions
): Promise<Page<Product>> {
  return apiGetPage<Product>(`/v1/sales/products/?${query(params)}`, init);
}

export function getProduct(uuid: string) {
  return apiGet<Product>(`/v1/sales/products/${uuid}/`);
}

export function createProduct(input: ProductInput) {
  return apiPost<Product>("/v1/sales/products/", input);
}

export function updateProduct(uuid: string, input: ProductInput) {
  return apiPatch<Product>(`/v1/sales/products/${uuid}/`, input);
}

export function deleteProduct(uuid: string) {
  return apiDelete<void>(`/v1/sales/products/${uuid}/`);
}
