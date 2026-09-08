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
} from "./api";

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, "detail"] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
};

export function useContractsQuery(
  params: ContractListParams = {},
  options?: Omit<UseQueryOptions<ContractListResult, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: contractKeys.list(params as Record<string, unknown>),
    queryFn: () => listContracts(params),
    ...options,
  });
}

export function useContractQuery(
  id: string,
  options?: Omit<UseQueryOptions<Contract, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: contractKeys.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    },
  });
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
