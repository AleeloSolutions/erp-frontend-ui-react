import { formatCurrency, formatDate } from "@erp/ui";
import { mockContracts, type DemoContract } from "../data/demo-table";
import { MockApiError, mockDelay } from "@/lib/mock";

export type Contract = DemoContract;
export type ContractStatus = Contract["status"];

export interface ContractListParams {
  search?: string;
  status?: ContractStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface ContractListResult {
  data: Contract[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContractInput {
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  value: number;
}

let store: Contract[] = mockContracts.map((contract) => ({ ...contract }));
let nextId = store.length + 1;

function formatDisplayDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return formatDate(date);
}

export async function listContracts(
  params: ContractListParams = {}
): Promise<ContractListResult> {
  await mockDelay();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";

  let filtered = [...store];

  if (search) {
    filtered = filtered.filter(
      (contract) =>
        contract.name.toLowerCase().includes(search) ||
        contract.customer.toLowerCase().includes(search)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((contract) => contract.status === status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getContract(id: string): Promise<Contract> {
  await mockDelay(300);
  const contract = store.find((item) => item.id === id);
  if (!contract) {
    throw new MockApiError("Contract not found", 404);
  }
  return { ...contract };
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  await mockDelay(700);

  if (input.name.toLowerCase().includes("fail")) {
    throw new MockApiError("Unable to create contract. Please try again.");
  }

  const contract: Contract = {
    id: String(nextId++),
    name: input.name,
    customer: input.customer,
    startDate: formatDisplayDate(input.startDate),
    endDate: formatDisplayDate(input.endDate),
    status: input.status,
    value: formatCurrency(input.value),
  };

  store = [contract, ...store];
  return contract;
}

export async function deleteContract(id: string): Promise<void> {
  await mockDelay(500);
  const exists = store.some((item) => item.id === id);
  if (!exists) {
    throw new MockApiError("Contract not found", 404);
  }
  store = store.filter((item) => item.id !== id);
}

/** Test helper — reset in-memory store to seed data. */
export function resetContractStore() {
  store = mockContracts.map((contract) => ({ ...contract }));
  nextId = store.length + 1;
}
