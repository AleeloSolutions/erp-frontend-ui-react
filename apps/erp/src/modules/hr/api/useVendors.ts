import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createVendor,
  deleteVendor,
  getVendor,
  getVendors,
  updateVendor,
} from "./vendors";
import type { DemoVendor } from "../data/demo-data";

export function useVendorsQuery(
  options?: Omit<UseQueryOptions<DemoVendor[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    ...options,
  });
}

export function useVendorQuery(
  id: string,
  options?: Omit<UseQueryOptions<DemoVendor, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendor(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateVendorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendor,
    onSuccess: (vendor) => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", vendor.id] });
    },
  });
}

export function useDeleteVendorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
