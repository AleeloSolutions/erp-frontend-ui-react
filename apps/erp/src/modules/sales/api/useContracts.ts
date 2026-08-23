import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createContract,
  deleteContract,
  getContract,
  listContracts,
  type Contract,
  type ContractListParams,
  type ContractListResult,
  type CreateContractInput,
} from "./contracts";
import { queryKeys } from "./query-keys";

export function useContractsQuery(
  params: ContractListParams = {},
  options?: Omit<UseQueryOptions<ContractListResult, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.contracts.list(params as Record<string, unknown>),
    queryFn: () => listContracts(params),
    ...options,
  });
}

export function useContractQuery(
  id: string,
  options?: Omit<UseQueryOptions<Contract, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: () => getContract(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContractInput) => createContract(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contracts.lists() });
    },
  });
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
  });
}
