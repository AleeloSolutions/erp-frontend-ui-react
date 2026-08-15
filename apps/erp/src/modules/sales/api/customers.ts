import { formatDate } from "@erp/ui";
import { mockCustomers, type DemoCustomer } from "../data/demo-table";
import { MockApiError, mockDelay } from "@/lib/mock";

export type Customer = DemoCustomer;

export interface CustomerListParams {
  search?: string;
  status?: "Active" | "Inactive" | "all";
  page?: number;
  pageSize?: number;
}

export interface CustomerListResult {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  address?: string;
  notes?: string;
}

let store: Customer[] = mockCustomers.map((customer) => ({ ...customer }));
let nextId = store.length + 1;

function formatCreated(date = new Date()) {
  return formatDate(date);
}

export async function listCustomers(
  params: CustomerListParams = {}
): Promise<CustomerListResult> {
  await mockDelay();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";

  let filtered = [...store];

  if (search) {
    filtered = filtered.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.phone.includes(search)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((customer) => customer.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getCustomer(id: string): Promise<Customer> {
  await mockDelay(300);
  const customer = store.find((item) => item.id === id);
  if (!customer) {
    throw new MockApiError("Customer not found", 404);
  }
  return { ...customer };
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<Customer> {
  await mockDelay(700);

  if (input.email.toLowerCase().includes("fail")) {
    throw new MockApiError("Unable to create customer. Please try again.");
  }

  const customer: Customer = {
    id: String(nextId++),
    name: input.name,
    email: input.email,
    phone: input.phone,
    status: input.status,
    test: "test",
    created: formatCreated(),
  };

  store = [customer, ...store];
  return customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  await mockDelay(500);
  const exists = store.some((item) => item.id === id);
  if (!exists) {
    throw new MockApiError("Customer not found", 404);
  }
  store = store.filter((item) => item.id !== id);
}

/** Test helper — reset in-memory store to seed data. */
export function resetCustomerStore() {
  store = mockCustomers.map((customer) => ({ ...customer }));
  nextId = store.length + 1;
}
