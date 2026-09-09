import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ME_QUERY_KEY } from "@/app/auth/useMe";
import { invalidateAfterModuleChange } from "./modulesApi";
import { PERMISSION_MATRIX_QUERY_KEY } from "./rolesApi";

const refreshSession = vi.hoisted(() => vi.fn(() => Promise.resolve(null)));

vi.mock("@/app/session", () => ({ refreshSession }));

describe("invalidateAfterModuleChange", () => {
  beforeEach(() => {
    refreshSession.mockClear();
  });

  it("refreshes the session and invalidates the me and matrix queries", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(ME_QUERY_KEY, { enabled_modules: ["sales"] });
    queryClient.setQueryData(PERMISSION_MATRIX_QUERY_KEY, { resources: [] });
    queryClient.setQueryData(["branches"], []);

    await invalidateAfterModuleChange(queryClient);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(ME_QUERY_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(PERMISSION_MATRIX_QUERY_KEY)?.isInvalidated).toBe(
      true
    );
    expect(queryClient.getQueryState(["branches"])?.isInvalidated).toBe(false);
  });

  it("still refreshes the session with no query client around", async () => {
    await invalidateAfterModuleChange(null);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });
});
