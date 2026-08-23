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
} from "./quotations";
import { queryKeys } from "./query-keys";

export function useQuotationsQuery(
  params: QuotationListParams = {},
  options?: Omit<UseQueryOptions<QuotationListResult, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.quotations.list(params as Record<string, unknown>),
    queryFn: () => listQuotations(params),
    ...options,
  });
}

export function useQuotationQuery(
  id: string,
  options?: Omit<UseQueryOptions<Quotation, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.quotations.detail(id),
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
        queryKey: queryKeys.quotations.lists(),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotation.id),
      });
    },
  });
}

export function useDeleteQuotationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
    },
  });
}
