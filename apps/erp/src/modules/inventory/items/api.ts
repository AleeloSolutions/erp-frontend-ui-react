import { api } from "@kaabe/runtime";

export interface Item {
  uuid: string;
  title: string;
  sku: string;
  quantity: string;
  branch: { uuid: string; name: string; code: string };
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  title: string;
  sku?: string;
  quantity?: string;
}

export const ITEMS_QUERY_KEY = ["inventory", "items"] as const;

export async function listItems(): Promise<Item[]> {
  const page = await api.apiGetPage<Item>(
    "/v1/inventory/items/?page_size=100&ordering=title"
  );
  return page.data;
}

export function createItem(input: ItemInput) {
  return api.apiPost<Item>("/v1/inventory/items/", input);
}

export function deleteItem(uuid: string) {
  return api.apiDelete(`/v1/inventory/items/${uuid}/`);
}
