/**
 * Platform → Module packages, against `/api/v1/platform/packages/`.
 *
 * Upload a zip, Promote opens backend/frontend PRs, Mark deployed after
 * Coolify/Vercel are green, Manual Activate switches the module on for
 * every workspace. While status is `promoting` the list polls.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { isAuthenticated } from "@/lib/auth";

export type PackageStatus =
  | "uploaded"
  | "promoting"
  | "pr_open"
  | "deployed"
  | "installed"
  | "failed"
  | "superseded"
  | "installing";

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
  backend_pr_url: string;
  frontend_pr_url: string;
  promoted_at: string | null;
  deployed_at: string | null;
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

/** Start promote-to-PR (alias path /install/). */
export function promotePackage(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/promote/`);
}

/** @deprecated use promotePackage */
export function installPackage(uuid: string) {
  return promotePackage(uuid);
}

export function markPackageDeployed(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/mark-deployed/`);
}

export function activatePackage(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/activate/`);
}

/** How often the list re-asks while a pipeline is running. */
export const POLL_MS = 2_000;

export function usePackages(pollMs = POLL_MS) {
  const [packages, setPackages] = useState<ModulePackage[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const hasLoaded = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    if (!hasLoaded.current) setLoading(true);
    void listPackages()
      .then((rows) => {
        if (id !== requestId.current) return;
        hasLoaded.current = true;
        setPackages(rows);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setPackages((current) => {
          if (current.length === 0) {
            setError(err instanceof Error ? err.message : "Could not load the packages.");
          }
          return current;
        });
        setLoading(false);
        hasLoaded.current = true;
      });
  }, [reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const promoting = packages.some(
    (row) => row.status === "promoting" || row.status === "installing"
  );
  useEffect(() => {
    if (!promoting) return;
    const timer = setInterval(reload, pollMs);
    return () => clearInterval(timer);
  }, [promoting, pollMs, reload]);

  return { packages, loading, error, reload };
}
