import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  updateQuotation,
  type CreateQuotationInput,
  type Quotation,
  type QuotationListParams,
  type QuotationListResult,
  type UpdateQuotationInput,
} from "./api";

export const quotationKeys = {
  all: ["quotations"] as const,
  lists: () => [...quotationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...quotationKeys.lists(), filters] as const,
  details: () => [...quotationKeys.all, "detail"] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
};

export function useQuotationsQuery(
  params: QuotationListParams = {},
  options?: Omit<UseQueryOptions<QuotationListResult, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: quotationKeys.list(params as Record<string, unknown>),
    queryFn: () => listQuotations(params),
    ...options,
  });
}

export function useQuotationQuery(
  id: string,
  options?: Omit<UseQueryOptions<Quotation, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => getQuotation(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateQuotationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuotationInput) => createQuotation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: quotationKeys.lists(),
      });
    },
  });
}

export function useUpdateQuotationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuotationInput }) =>
      updateQuotation(id, input),
    onSuccess: (quotation) => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: quotationKeys.detail(quotation.id),
      });
    },
  });
}

export function useDeleteQuotationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}
