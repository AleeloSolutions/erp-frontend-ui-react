/**
 * Stock movements against `/api/v1/inventory/movements/`.
 *
 * Append-only: list + create. Corrections are a new movement.
 */

import { apiGet, apiGetPage, apiPost } from "@/lib/api-client";
import { query, type BranchRef, type ListParams, type Page } from "../shared/api";

export type MovementType = "in" | "out" | "adjust";

export interface MovementItemRef {
  uuid: string;
  name: string;
  sku: string;
}

export interface StockMovement {
  uuid: string;
  movement_type: MovementType;
  quantity: string;
  quantity_before: string;
  quantity_after: string;
  note: string;
  item: MovementItemRef;
  branch: BranchRef | null;
  created_at: string;
}

export type StockMovementInput = {
  item_uuid: string;
  movement_type: MovementType;
  quantity: string;
  note?: string;
  branch_uuid?: string;
};

export function listMovements(params: ListParams = {}): Promise<Page<StockMovement>> {
  return apiGetPage<StockMovement>(`/v1/inventory/movements/?${query(params)}`);
}

export interface MovementFacets {
  quantity_min: string | null;
  quantity_max: string | null;
}

export function getMovementFacets() {
  return apiGet<MovementFacets>("/v1/inventory/movements/facets/");
}

export function getMovement(uuid: string) {
  return apiGet<StockMovement>(`/v1/inventory/movements/${uuid}/`);
}

export function createMovement(input: StockMovementInput) {
  return apiPost<StockMovement>("/v1/inventory/movements/", input);
}
