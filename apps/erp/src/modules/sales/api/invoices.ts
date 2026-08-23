import { formatCurrency, formatDate } from "@erp/ui";
import { mockInvoices, type DemoInvoice, type InvoiceLine } from "../data/demo-table";
import { MockApiError, mockDelay } from "@/lib/mock";

export type Invoice = DemoInvoice;
export type InvoiceStatus = Invoice["status"];
export type InvoicePaymentStatus = Invoice["paymentStatus"];
export type { InvoiceLine };

export interface InvoiceListParams {
  search?: string;
  status?: InvoiceStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface InvoiceListResult {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  customer: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  notes?: string;
  lines: InvoiceLineInput[];
}

export type UpdateInvoiceInput = CreateInvoiceInput;

let store: Invoice[] = mockInvoices.map((invoice) => ({ ...invoice }));
let nextId = store.length + 1;
let nextLineId = 1;

function formatDisplayDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return formatDate(date);
}

function toLines(lines: InvoiceLineInput[]): InvoiceLine[] {
  return lines.map((line) => ({ id: `l-${nextLineId++}`, ...line }));
}

function totalAmount(lines: InvoiceLineInput[]) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export async function listInvoices(
  params: InvoiceListParams = {}
): Promise<InvoiceListResult> {
  await mockDelay();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";

  let filtered = [...store];

  if (search) {
    filtered = filtered.filter(
      (invoice) =>
        invoice.number.toLowerCase().includes(search) ||
        invoice.customer.toLowerCase().includes(search)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((invoice) => invoice.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getInvoice(id: string): Promise<Invoice> {
  await mockDelay(300);
  const invoice = store.find((item) => item.id === id);
  if (!invoice) {
    throw new MockApiError("Invoice not found", 404);
  }
  return { ...invoice };
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  await mockDelay(700);

  if (input.customer.toLowerCase().includes("fail")) {
    throw new MockApiError("Unable to create invoice. Please try again.");
  }

  const id = String(nextId++);
  const invoice: Invoice = {
    id,
    number: `INV-2026-${id.padStart(4, "0")}`,
    customer: input.customer,
    date: formatDisplayDate(input.date),
    dueDate: formatDisplayDate(input.dueDate),
    status: input.status,
    paymentStatus: input.paymentStatus,
    amount: formatCurrency(totalAmount(input.lines)),
    lines: toLines(input.lines),
  };

  store = [invoice, ...store];
  return invoice;
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput
): Promise<Invoice> {
  await mockDelay(700);

  const index = store.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new MockApiError("Invoice not found", 404);
  }

  if (input.customer.toLowerCase().includes("fail")) {
    throw new MockApiError("Unable to update invoice. Please try again.");
  }

  const existing = store[index];
  const invoice: Invoice = {
    ...existing,
    customer: input.customer,
    date: formatDisplayDate(input.date),
    dueDate: formatDisplayDate(input.dueDate),
    status: input.status,
    paymentStatus: input.paymentStatus,
    amount: formatCurrency(totalAmount(input.lines)),
    lines: toLines(input.lines),
  };

  store = [...store.slice(0, index), invoice, ...store.slice(index + 1)];
  return invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  await mockDelay(500);
  const exists = store.some((item) => item.id === id);
  if (!exists) {
    throw new MockApiError("Invoice not found", 404);
  }
  store = store.filter((item) => item.id !== id);
}

/** Test helper — reset in-memory store to seed data. */
export function resetInvoiceStore() {
  store = mockInvoices.map((invoice) => ({ ...invoice }));
  nextId = store.length + 1;
}
