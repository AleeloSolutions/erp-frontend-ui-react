import { useQuery } from "@tanstack/react-query";
import { isAuthenticated } from "@/lib/auth";
import { fetchMe } from "./api";

export const ME_QUERY_KEY = ["auth", "me"] as const;

/** The authenticated user + their client; disabled when signed out. */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled: isAuthenticated(),
    staleTime: 60_000,
  });
}
