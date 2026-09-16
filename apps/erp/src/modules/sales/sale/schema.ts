/**
 * The sale editor's own shape, and the translation to and from the API.
 *
 * Quantities and prices stay strings the whole way — decimals on the backend.
 */

import { z } from "zod";
import type { LineKind, SaleLine, SaleLineInput, SaleStatus } from "./api";

export const saleFormSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  issue_date: z.string().min(1, "Sale date is required"),
  valid_until: z.string().min(1, "Valid-until date is required"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.string(),
  customer_reference: z.string(),
  notes: z.string(),
  terms: z.string(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

/** UI labels: sent reads as Pending, accepted as Approved. */
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  draft: "Draft",
  sent: "Pending",
  accepted: "Approved",
  cancelled: "Cancelled",
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validUntilFrom(issueDate: string, defaultValidDays: number): string {
  const days = Number(defaultValidDays);
  const date = new Date(`${issueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return issueDate;
  date.setDate(date.getDate() + (Number.isFinite(days) ? days : 30));
  if (Number.isNaN(date.getTime())) return issueDate;
  return date.toISOString().slice(0, 10);
}

export function emptySaleForm(): SaleFormValues {
  return {
    customer: "",
    issue_date: todayIso(),
    valid_until: todayIso(),
    discount_type: "percentage",
    discount_value: "0",
    customer_reference: "",
    notes: "",
    terms: "",
  };
}

export interface SaleLineFormValue {
  id: string;
  kind: LineKind;
  description: string;
  quantity: string;
  unit_price: string;
  tax: string | null;
}

let nextLineId = 1;

export function createEmptySaleLine(tax: string | null = null): SaleLineFormValue {
  return {
    id: `new-${nextLineId++}`,
    kind: "product",
    description: "",
    quantity: "1",
    unit_price: "0",
    tax,
  };
}

export function createSaleSectionLine(): SaleLineFormValue {
  return { ...createEmptySaleLine(), kind: "section" };
}

export function createSaleNoteLine(): SaleLineFormValue {
  return { ...createEmptySaleLine(), kind: "note" };
}

export function toFormLines(lines: SaleLine[]): SaleLineFormValue[] {
  return lines.map((line) => ({
    id: line.uuid,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    tax: line.tax,
  }));
}

export function toLineInputs(lines: SaleLineFormValue[]): SaleLineInput[] {
  return lines
    .filter((line) => line.description.trim().length > 0)
    .map((line) =>
      line.kind === "product"
        ? {
            kind: line.kind,
            description: line.description.trim(),
            quantity: line.quantity || "0",
            unit_price: line.unit_price || "0",
            tax: line.tax,
          }
        : {
            kind: line.kind,
            description: line.description.trim(),
            quantity: "0",
            unit_price: "0",
            tax: null,
          }
    );
}

export function hasChargeableLine(lines: SaleLineFormValue[]): boolean {
  return lines.some(
    (line) => line.kind === "product" && line.description.trim().length > 0
  );
}

export function estimateLineAmount(line: SaleLineFormValue): number {
  if (line.kind !== "product") return 0;
  return (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
}

export function estimateUntaxedTotal(lines: SaleLineFormValue[]): number {
  return lines.reduce((sum, line) => sum + estimateLineAmount(line), 0);
}

export function formatMoney(amount: string, currency: string): string {
  return currency ? `${amount} ${currency}` : amount;
}

/** Sum money strings (2 dp) for a group portion; splits by currency when mixed. */
export function sumMoneyByCurrency(
  rows: { total_amount: string; currency: string }[]
): string {
  const byCurrency = new Map<string, number>();
  for (const row of rows) {
    const code = row.currency || "";
    const next = (byCurrency.get(code) ?? 0) + (Number(row.total_amount) || 0);
    byCurrency.set(code, next);
  }
  return [...byCurrency.entries()]
    .map(([code, total]) => formatMoney(total.toFixed(2), code))
    .join(" · ");
}
