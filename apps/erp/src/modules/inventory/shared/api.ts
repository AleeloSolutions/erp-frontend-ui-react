/**
 * Transport shared by every inventory entity: the list-parameter shape
 * each server-side list takes, the query-string builder behind it, and
 * the tenant's stock defaults.
 *
 * Entity-specific calls live in that entity's own `api.ts`.
 */

import { api } from "@kaabe/runtime";

/** Mirrors the host api-client Page shape (not importable into the IIFE). */
export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

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
  /**
   * Extra server-side filters. Values may be a single string or several
   * (DataTable select facets are multi-check) — arrays become repeated
   * query params (`movement_type=in&movement_type=out`).
   */
  filters?: Record<string, string | string[]>;
}

export interface InventorySettings {
  uuid: string;
  default_unit: string;
  low_stock_threshold: string;
}

export type InventorySettingsInput = Partial<{
  default_unit: string;
  low_stock_threshold: string;
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
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) search.append(key, entry);
      }
    } else if (value) {
      search.set(key, value);
    }
  }
  return search.toString();
}

export function getInventorySettings() {
  return api.apiGet<InventorySettings>("/v1/inventory/settings/");
}

export function updateInventorySettings(input: InventorySettingsInput) {
  return api.apiPatch<InventorySettings>("/v1/inventory/settings/", input);
}
