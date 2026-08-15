import { formatDate } from "@erp/ui";
import {
  mockProducts,
  type DemoProduct,
  type ProductCategory,
  type ProductStatus,
  type ProductUnit,
} from "../data/demo-products";
import { MockApiError, mockDelay } from "@/lib/mock";

export type Product = DemoProduct;

export interface ProductListParams {
  search?: string;
  status?: ProductStatus | "all";
  category?: ProductCategory | "all";
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  unitPrice: number;
  costPrice: number;
  stockQty: number;
  reorderLevel: number;
  status: ProductStatus;
  barcode?: string;
  description?: string;
}

export type UpdateProductInput = CreateProductInput;

let store: Product[] = mockProducts.map((product) => ({ ...product }));
let nextId = store.length + 1;

function formatStamp(date = new Date()) {
  return formatDate(date);
}

function assertUniqueSku(sku: string, excludeId?: string) {
  const normalized = sku.trim().toLowerCase();
  const conflict = store.find(
    (item) =>
      item.sku.toLowerCase() === normalized &&
      (excludeId == null || item.id !== excludeId)
  );
  if (conflict) {
    throw new MockApiError(`SKU "${sku}" is already in use.`);
  }
}

export async function listProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  await mockDelay();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";
  const category = params.category ?? "all";

  let filtered = [...store];

  if (search) {
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        (product.barcode?.includes(search) ?? false) ||
        product.category.toLowerCase().includes(search)
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((product) => product.status === status);
  }

  if (category !== "all") {
    filtered = filtered.filter((product) => product.category === category);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getProduct(id: string): Promise<Product> {
  await mockDelay(300);
  const product = store.find((item) => item.id === id);
  if (!product) {
    throw new MockApiError("Product not found", 404);
  }
  return { ...product };
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  await mockDelay(700);

  if (
    input.sku.toLowerCase().includes("fail") ||
    input.name.toLowerCase().includes("fail")
  ) {
    throw new MockApiError("Unable to create product. Please try again.");
  }

  assertUniqueSku(input.sku);

  const stamp = formatStamp();
  const product: Product = {
    id: String(nextId++),
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    unitPrice: input.unitPrice,
    costPrice: input.costPrice,
    stockQty: input.stockQty,
    reorderLevel: input.reorderLevel,
    status: input.status,
    barcode: input.barcode?.trim() || undefined,
    description: input.description?.trim() || undefined,
    created: stamp,
    updated: stamp,
  };

  store = [product, ...store];
  return product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  await mockDelay(700);

  const index = store.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new MockApiError("Product not found", 404);
  }

  if (
    input.sku.toLowerCase().includes("fail") ||
    input.name.toLowerCase().includes("fail")
  ) {
    throw new MockApiError("Unable to update product. Please try again.");
  }

  assertUniqueSku(input.sku, id);

  const existing = store[index];
  const product: Product = {
    ...existing,
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    unitPrice: input.unitPrice,
    costPrice: input.costPrice,
    stockQty: input.stockQty,
    reorderLevel: input.reorderLevel,
    status: input.status,
    barcode: input.barcode?.trim() || undefined,
    description: input.description?.trim() || undefined,
    updated: formatStamp(),
  };

  store = [...store.slice(0, index), product, ...store.slice(index + 1)];
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  await mockDelay(500);
  const exists = store.some((item) => item.id === id);
  if (!exists) {
    throw new MockApiError("Product not found", 404);
  }
  store = store.filter((item) => item.id !== id);
}

/** Test helper — reset in-memory store to seed data. */
export function resetProductStore() {
  store = mockProducts.map((product) => ({ ...product }));
  nextId = store.length + 1;
}
