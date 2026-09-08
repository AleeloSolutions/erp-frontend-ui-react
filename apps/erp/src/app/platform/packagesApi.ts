/**
 * Platform → Module packages, against `/api/v1/platform/packages/`.
 *
 * A package is a module zip a platform-staff member uploads; installing
 * it runs a pipeline on the server (checks, unpack, migrate, activate for
 * every tenant, reload) whose progress lands in the row's `install_log`.
 * While a package is installing the list polls, so the screen follows
 * the pipeline without a refresh.
 *
 * Plain state + effect rather than React Query, like the rest of the
 * app's own screens.
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

export type PackageStatus =
  "uploaded" | "installing" | "installed" | "failed" | "superseded";

export interface ModulePackage {
  uuid: string;
  key: string;
  version: string;
  label: string;
  status: PackageStatus;
  has_bundle: boolean;
  has_styles: boolean;
  checksum: string;
  install_log: string;
  installed_at: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export function listPackages() {
  return apiGet<ModulePackage[]>("/v1/platform/packages/");
}

/** Multipart upload of one zip. */
export function uploadPackage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiPost<ModulePackage>("/v1/platform/packages/", form, { rawBody: true });
}

export function installPackage(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/install/`);
}

/** How often the list re-asks while a pipeline is running. */
export const POLL_MS = 2_000;

export function usePackages(pollMs = POLL_MS) {
  const [packages, setPackages] = useState<ModulePackage[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    void listPackages()
      .then((rows) => {
        if (cancelled) return;
        setPackages(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPackages([]);
        setError(err instanceof Error ? err.message : "Could not load the packages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // A running pipeline: keep asking until it lands, one way or the other.
  const installing = packages.some((row) => row.status === "installing");
  useEffect(() => {
    if (!installing) return;
    const timer = setTimeout(reload, pollMs);
    return () => clearTimeout(timer);
  }, [installing, packages, pollMs, reload]);

  return { packages, loading, error, reload };
}
