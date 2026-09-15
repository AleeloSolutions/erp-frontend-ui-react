/**
 * React Query hooks for products.
 */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Page } from "@/lib/api-client";
import type { ListParams } from "../shared/api";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  type Product,
  type ProductInput,
} from "./api";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProductsQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Product>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: productKeys.list(params as Record<string, unknown>),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useProductQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Product, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: productKeys.detail(uuid),
    queryFn: () => getProduct(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: ProductInput }) =>
      updateProduct(uuid, input),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.setQueryData(productKeys.detail(product.uuid), product);
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteProduct(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
