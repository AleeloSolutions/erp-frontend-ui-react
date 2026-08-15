export const queryKeys = {
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  quotations: {
    all: ["quotations"] as const,
    lists: () => [...queryKeys.quotations.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.quotations.lists(), filters] as const,
    details: () => [...queryKeys.quotations.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.quotations.details(), id] as const,
  },
};
