/**
 * Categories against `/api/v1/inventory/categories/`.
 *
 * Addressed by `uuid` — the API exposes no `id` — and every list is
 * paginated, searched, sorted and filtered server-side.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { query, type ListParams, type Page } from "../shared/api";

export interface Category {
  uuid: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryInput = Partial<Omit<Category, "uuid" | "created_at" | "updated_at">>;

export function listCategories(params: ListParams = {}): Promise<Page<Category>> {
  return apiGetPage<Category>(`/v1/inventory/categories/?${query(params)}`);
}

export function getCategory(uuid: string) {
  return apiGet<Category>(`/v1/inventory/categories/${uuid}/`);
}

export function createCategory(input: CategoryInput) {
  return apiPost<Category>("/v1/inventory/categories/", input);
}

export function updateCategory(uuid: string, input: CategoryInput) {
  return apiPatch<Category>(`/v1/inventory/categories/${uuid}/`, input);
}

export function deleteCategory(uuid: string) {
  return apiDelete<void>(`/v1/inventory/categories/${uuid}/`);
}
