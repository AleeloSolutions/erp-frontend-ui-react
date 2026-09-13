/**
 * Platform → Module packages, against `/api/v1/platform/packages/`.
 *
 * Upload a zip, Promote opens backend/frontend PRs, Mark deployed after
 * Coolify/Vercel are green, Manual Activate switches the module on for
 * every workspace. While status is `promoting` the list polls.
 *
 * Recovery: Replace zip on uploaded/failed; Cancel promote when stuck
 * on promoting; Activate stays deployed on failure so Retry Activate works.
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

/** Swap the zip on an uploaded or failed package (same key + version). */
export function replacePackageZip(uuid: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/replace/`, form, {
    rawBody: true,
  });
}

/** Start promote-to-PR (alias path /install/). */
export function promotePackage(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/promote/`);
}

/** Abort promoting and reset to uploaded. */
export function cancelPromote(uuid: string) {
  return apiPost<ModulePackage>(`/v1/platform/packages/${uuid}/cancel/`);
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

/** True when the promote log never left the spawn handoff. */
export function isPromoteStuckQueued(row: ModulePackage): boolean {
  if (row.status !== "promoting" && row.status !== "installing") return false;
  const lines = row.install_log
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return true;
  if (lines[0] !== "queued") return false;
  return lines.every(
    (line, index) => index === 0 || /^\[\d{2}:\d{2}:\d{2}\] worker pid /.test(line)
  );
}

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
