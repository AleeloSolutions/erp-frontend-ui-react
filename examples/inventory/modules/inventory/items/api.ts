/**
 * Items against `/api/v1/inventory/items/`.
 *
 * Addressed by `uuid` — the API exposes no `id` — and every list is
 * paginated, searched, sorted and filtered server-side.
 *
 * `quantity` is on-hand stock. It is opening stock when an item is
 * created and read-only afterwards: from then on only a stock movement
 * moves it, so the edit form never sends it.
 */

import { apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api-client";
import { query, type BranchRef, type ListParams, type Page } from "../shared/api";

export interface CategoryRef {
  uuid: string;
  name: string;
}

export interface Item {
  uuid: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  unit: string;
  /** Decimal strings, printed exactly as the server sent them. */
  cost_price: string;
  sale_price: string;
  quantity: string;
  reorder_level: string;
  is_tracked: boolean;
  is_archived: boolean;
  category: CategoryRef | null;
  branch: BranchRef | null;
  created_at: string;
  updated_at: string;
}

export type ItemInput = Partial<
  Omit<Item, "uuid" | "category" | "branch" | "created_at" | "updated_at">
> & {
  /** Empty string clears the category; omitted leaves it alone. */
  category_uuid?: string;
  branch_uuid?: string;
};

export function listItems(params: ListParams = {}): Promise<Page<Item>> {
  return apiGetPage<Item>(`/v1/inventory/items/?${query(params)}`);
}

export function getItem(uuid: string) {
  return apiGet<Item>(`/v1/inventory/items/${uuid}/`);
}

export function createItem(input: ItemInput) {
  return apiPost<Item>("/v1/inventory/items/", input);
}

export function updateItem(uuid: string, input: ItemInput) {
  return apiPatch<Item>(`/v1/inventory/items/${uuid}/`, input);
}

export function deleteItem(uuid: string) {
  return apiDelete<void>(`/v1/inventory/items/${uuid}/`);
}
