/**
 * React Query hooks for contracts.
 *
 * Lists are server-side paginated, so the query key carries the whole
 * parameter object and a page change is a new query rather than a client
 * filter over everything.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Page } from "@/lib/api-client";
import type { ListParams } from "../shared/api";
import {
  createContract,
  deleteContract,
  getContract,
  listContracts,
  updateContract,
  type Contract,
  type ContractInput,
} from "./api";

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, "detail"] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
};

export function useContractsQuery(
  params: ListParams = {},
  options?: Omit<UseQueryOptions<Page<Contract>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: contractKeys.list(params as Record<string, unknown>),
    queryFn: () => listContracts(params),
    ...options,
  });
}

export function useContractQuery(
  uuid: string,
  options?: Omit<UseQueryOptions<Contract, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: contractKeys.detail(uuid),
    queryFn: () => getContract(uuid),
    enabled: Boolean(uuid),
    ...options,
  });
}

export function useCreateContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractInput) => createContract(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
}

export function useUpdateContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: { uuid: string; input: Partial<ContractInput> }) =>
      updateContract(uuid, input),
    onSuccess: (contract) => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contract.uuid),
      });
    },
  });
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteContract(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
