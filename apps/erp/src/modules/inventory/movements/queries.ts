import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ListParams, Page } from "../shared/api";
import {
  createMovement,
  getMovement,
  getMovementFacets,
  listMovements,
  type MovementFacets,
  type StockMovement,
  type StockMovementInput,
} from "./api";
import { itemKeys } from "../items/queries";

export const movementKeys = {
  all: ["inventory-movements"] as const,
  lists: () => [...movementKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...movementKeys.lists(), filters] as const,
  details: () => [...movementKeys.all, "detail"] as const,
  detail: (id: string) => [...movementKeys.details(), id] as const,
  facets: () => [...movementKeys.all, "facets"] as const,
};

export function useMovementsQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<StockMovement>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: movementKeys.list(params as Record<string, unknown>),
    queryFn: () => listMovements(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useMovementFacetsQuery(
  options?: Omit<UseQueryOptions<MovementFacets, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: movementKeys.facets(),
    queryFn: () => getMovementFacets(),
    staleTime: 60_000,
    ...options,
  });
}

export function useMovementQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<StockMovement, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: movementKeys.detail(uuid),
    queryFn: () => getMovement(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateMovementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StockMovementInput) => createMovement(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: movementKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: movementKeys.facets() });
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
