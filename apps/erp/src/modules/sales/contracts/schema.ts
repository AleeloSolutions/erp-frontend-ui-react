/**
 * The contract form's own shape.
 *
 * Header-only (v1): no lines, so no editor grid to translate, unlike a
 * quotation or invoice's schema.
 */

import { z } from "zod";
import type { ContractStatus } from "./api";

export const contractFormSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  name: z.string().min(1, "Contract name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  status: z.enum(["draft", "active", "expired"]),
  value_amount: z.string(),
  notes: z.string(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

/** UI labels for the status field. */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  active: "Active",
  expired: "Expired",
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function plusDaysIso(days: number, from: string = todayIso()): string {
  const date = new Date(`${from}T00:00:00`);
  if (Number.isNaN(date.getTime())) return from;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function emptyContractForm(): ContractFormValues {
  return {
    customer: "",
    name: "",
    start_date: todayIso(),
    end_date: plusDaysIso(365),
    status: "draft",
    value_amount: "0",
    notes: "",
  };
}

export function formatMoney(amount: string, currency: string): string {
  return currency ? `${amount} ${currency}` : amount;
}
