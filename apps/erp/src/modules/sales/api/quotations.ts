import { formatCurrency, formatDate } from "@erp/ui";
import { mockQuotations, type DemoQuotation } from "../data/demo-table";
import { MockApiError, mockDelay } from "@/lib/mock";

export type Quotation = DemoQuotation;
export type QuotationStatus = Quotation["status"];

export interface QuotationListParams {
  search?: string;
  status?: QuotationStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface QuotationListResult {
  data: Quotation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateQuotationInput {
  customer: string;
  date: string;
  validUntil: string;
  status: QuotationStatus;
  amount: number;
  notes?: string;
}

let store: Quotation[] = mockQuotations.map((quotation) => ({ ...quotation }));
let nextId = store.length + 1;

function formatDisplayDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return formatDate(date);
}

function formatAmount(amount: number) {
  return formatCurrency(amount);
}

export async function listQuotations(
  params: QuotationListParams = {}
): Promise<QuotationListResult> {
  await mockDelay();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";

  let filtered = [...store];

  if (search) {
    filtered = filtered.filter(
      (quotation) =>
        quotation.number.toLowerCase().includes(search) ||
        quotation.customer.toLowerCase().includes(search) ||
        quotation.amount.toLowerCase().includes(search)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((quotation) => quotation.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getQuotation(id: string): Promise<Quotation> {
  await mockDelay(300);
  const quotation = store.find((item) => item.id === id);
  if (!quotation) {
    throw new MockApiError("Quotation not found", 404);
  }
  return { ...quotation };
}

export async function createQuotation(
  input: CreateQuotationInput
): Promise<Quotation> {
  await mockDelay(700);

  if (input.customer.toLowerCase().includes("fail")) {
    throw new MockApiError("Unable to create quotation. Please try again.");
  }

  const id = String(nextId++);
  const quotation: Quotation = {
    id,
    number: `QT-2026-${id.padStart(4, "0")}`,
    customer: input.customer,
    date: formatDisplayDate(input.date),
    validUntil: formatDisplayDate(input.validUntil),
    status: input.status,
    amount: formatAmount(input.amount),
  };

  store = [quotation, ...store];
  return quotation;
}

export async function deleteQuotation(id: string): Promise<void> {
  await mockDelay(500);
  const exists = store.some((item) => item.id === id);
  if (!exists) {
    throw new MockApiError("Quotation not found", 404);
  }
  store = store.filter((item) => item.id !== id);
}

/** Test helper — reset in-memory store to seed data. */
export function resetQuotationStore() {
  store = mockQuotations.map((quotation) => ({ ...quotation }));
  nextId = store.length + 1;
}
