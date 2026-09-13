/**
 * Transport shared by every inventory entity: the list-parameter shape
 * each server-side list takes, the query-string builder behind it, and
 * the tenant's stock defaults.
 *
 * Entity-specific calls live in that entity's own `api.ts`.
 */

import { apiGet, apiPatch } from "@/lib/api-client";
import type { Page } from "@/lib/api-client";

export type { Page };

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

export function query(params: ListParams = {}): string {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.ordering) search.set("ordering", params.ordering);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("page_size", String(params.pageSize));
  for (const [key, value] of Object.entries(params.filters ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== "") search.append(key, item);
      }
    } else {
      search.set(key, value);
    }
  }
  return search.toString();
}

export interface InventorySettings {
  uuid: string;
  default_unit: string;
  low_stock_threshold: string;
  updated_at: string;
}

export type InventorySettingsInput = Partial<
  Pick<InventorySettings, "default_unit" | "low_stock_threshold">
>;

export function fetchSettings() {
  return apiGet<InventorySettings>("/v1/inventory/settings/");
}

export function updateSettings(input: InventorySettingsInput) {
  return apiPatch<InventorySettings>("/v1/inventory/settings/", input);
}
