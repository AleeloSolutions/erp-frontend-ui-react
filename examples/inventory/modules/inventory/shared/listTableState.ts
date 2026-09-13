/**
 * Shared loading/error helpers for inventory server lists.
 *
 * Keep previous rows while refetching (stable height → no scrollbar shake).
 * `fetching` drives an in-place progress cue on the table, not a skeleton.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type { Page } from "./api";

export function listTableState<T>(query: UseQueryResult<Page<T>, Error>) {
  return {
    rows: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    loading: query.isLoading && !query.data,
    fetching: query.isFetching && Boolean(query.data),
    error: query.isError && !query.data ? query.error.message : null,
  };
}
