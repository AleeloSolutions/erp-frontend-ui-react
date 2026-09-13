/**
 * Platform → Module packages: upload, promote to PRs, mark deployed, activate.
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Upload } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  StatusBadge,
  useToast,
  type DataTableRowAction,
} from "@erp/ui";
import { AppShell, useNavbarDefaults } from "@/app";
import { ApiError } from "@/lib/api-client";
import {
  activatePackage,
  cancelPromote,
  isPromoteStuckQueued,
  markPackageDeployed,
  promotePackage,
  replacePackageZip,
  uploadPackage,
  usePackages,
  type ModulePackage,
  type PackageStatus,
} from "./packagesApi";

const STATUS_BADGE: Record<PackageStatus, { status: string; label: string }> = {
  uploaded: { status: "draft", label: "Uploaded" },
  promoting: { status: "pending", label: "Promoting" },
  installing: { status: "pending", label: "Promoting" },
  pr_open: { status: "pending", label: "PRs open" },
  deployed: { status: "active", label: "Deployed" },
  installed: { status: "active", label: "Activated" },
  failed: { status: "overdue", label: "Failed" },
  superseded: { status: "inactive", label: "Superseded" },
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function lastLogHint(log: string): string | null {
  const lines = log
    .split("\n")
    .map((line) => line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const promoteFailed = [...lines]
    .reverse()
    .find((line) => line.startsWith("promote failed:"));
  if (promoteFailed) return promoteFailed.replace(/^promote failed:\s*/i, "");
  const checksFailed = [...lines]
    .reverse()
    .find(
      (line) => line.includes("failed its checks") || line.startsWith("CommandError:")
    );
  if (checksFailed) return checksFailed;
  return lines[lines.length - 1];
}

export default function ModulePackagesPage() {
  const navbar = useNavbarDefaults({ brandLabel: "Platform" });
  const { toast } = useToast();
  const { packages, loading, error, reload } = usePackages();
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replacingUuid, setReplacingUuid] = useState<string | null>(null);
  const [pendingPromote, setPendingPromote] = useState<ModulePackage | null>(null);
  const [pendingActivate, setPendingActivate] = useState<ModulePackage | null>(null);
  const [pendingCancel, setPendingCancel] = useState<ModulePackage | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected = packages.find((row) => row.uuid === selectedUuid) ?? null;
  const seenStatus = useRef<Record<string, PackageStatus>>({});

  useEffect(() => {
    for (const row of packages) {
      const previous = seenStatus.current[row.uuid];
      seenStatus.current[row.uuid] = row.status;
      if (previous !== "promoting" && previous !== "installing") continue;
      if (row.status === "pr_open") {
        toast({
          title: `${row.label} ${row.version} PRs opened`,
          description: "Review, merge, deploy, then Mark deployed.",
          variant: "success",
        });
      } else if (row.status === "failed") {
        toast({
          title: `${row.label} ${row.version} failed to promote`,
          description: "Open the log, then Replace zip or Retry promote.",
          variant: "error",
        });
      } else if (row.status === "uploaded" && previous === "promoting") {
        // Cancelled back to uploaded — no toast here; cancel handler toasts.
      }
    }
  }, [packages, toast]);

  function reportFailure(err: unknown, fallback: string) {
    toast({
      title: fallback,
      description: err instanceof ApiError ? err.message : "Please try again.",
      variant: "error",
    });
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadPackage(file);
      toast({
        title: `${uploaded.label} ${uploaded.version} uploaded`,
        description: "Checked and stored. Promote it when you are ready.",
        variant: "success",
      });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setSelectedUuid(uploaded.uuid);
      reload();
    } catch (err) {
      reportFailure(err, "Could not upload the package");
    } finally {
      setUploading(false);
    }
  }

  function startReplace(row: ModulePackage) {
    setReplacingUuid(row.uuid);
    replaceInput.current?.click();
  }

  async function onReplaceFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    const uuid = replacingUuid;
    event.target.value = "";
    setReplacingUuid(null);
    if (!next || !uuid) return;
    const row = packages.find((item) => item.uuid === uuid);
    try {
      const updated = await replacePackageZip(uuid, next);
      toast({
        title: `${updated.label} ${updated.version} zip replaced`,
        description: "Status reset to Uploaded. Promote when ready.",
        variant: "success",
      });
      setSelectedUuid(updated.uuid);
      reload();
    } catch (err) {
      reportFailure(err, `Could not replace zip for ${row?.label ?? "package"}`);
    }
  }

  async function promote(row: ModulePackage) {
    try {
      await promotePackage(row.uuid);
      toast({
        title: `Promoting ${row.label} ${row.version}`,
        description: "Opening pull requests on backend and frontend.",
        variant: "info",
      });
      setPendingPromote(null);
      setSelectedUuid(row.uuid);
      reload();
    } catch (err) {
      reportFailure(err, `Could not start promoting ${row.label}`);
    }
  }

  async function cancel(row: ModulePackage) {
    const discardingPrs = row.status === "pr_open";
    try {
      await cancelPromote(row.uuid);
      toast({
        title: discardingPrs
          ? `${row.label} PRs discarded`
          : `${row.label} promote cancelled`,
        description: discardingPrs
          ? "Reset to Uploaded. Replace the zip if needed, then Promote again."
          : "Reset to Uploaded. Replace the zip or Promote again.",
        variant: "info",
      });
      setPendingCancel(null);
      setSelectedUuid(row.uuid);
      reload();
    } catch (err) {
      reportFailure(
        err,
        discardingPrs
          ? `Could not discard PRs for ${row.label}`
          : `Could not cancel promote for ${row.label}`
      );
    }
  }

  async function markDeployed(row: ModulePackage) {
    try {
      await markPackageDeployed(row.uuid);
      toast({
        title: `${row.label} marked deployed`,
        description: "You can Activate it for every workspace.",
        variant: "success",
      });
      reload();
    } catch (err) {
      reportFailure(err, `Could not mark ${row.label} deployed`);
    }
  }

  async function activate(row: ModulePackage) {
    try {
      const result = await activatePackage(row.uuid);
      toast({
        title:
          result.status === "installed"
            ? `${row.label} activated`
            : `${row.label} activate did not finish`,
        description:
          result.status === "installed"
            ? "Switched on for every workspace."
            : "Still Deployed — fix the issue and Retry Activate. See the log.",
        variant: result.status === "installed" ? "success" : "error",
      });
      setPendingActivate(null);
      reload();
    } catch (err) {
      reportFailure(err, `Could not activate ${row.label}`);
    }
  }

  const columns = useMemo<ColumnDef<ModulePackage>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Module",
        meta: { fill: true },
        size: 220,
        cell: ({ row }) => (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left text-erp-brand-third hover:underline"
            onClick={() => setSelectedUuid(row.original.uuid)}
          >
            {row.original.label}
          </button>
        ),
      },
      { accessorKey: "key", header: "Key", size: 100 },
      { accessorKey: "version", header: "Version", size: 90 },
      {
        id: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const badge = STATUS_BADGE[row.original.status];
          return <StatusBadge status={badge.status} label={badge.label} />;
        },
      },
      {
        id: "prs",
        header: "PRs",
        size: 140,
        enableSorting: false,
        cell: ({ row }) => {
          const { backend_pr_url: backend, frontend_pr_url: frontend } = row.original;
          if (!backend && !frontend) return "—";
          return (
            <span className="inline-flex flex-col gap-0.5 text-[11px]">
              {backend ? (
                <a
                  href={backend}
                  target="_blank"
                  rel="noreferrer"
                  className="text-erp-blue hover:underline"
                >
                  Backend
                </a>
              ) : null}
              {frontend ? (
                <a
                  href={frontend}
                  target="_blank"
                  rel="noreferrer"
                  className="text-erp-blue hover:underline"
                >
                  Frontend
                </a>
              ) : null}
            </span>
          );
        },
      },
      {
        id: "installed_at",
        header: "Activated",
        size: 170,
        cell: ({ row }) => formatDateTime(row.original.installed_at),
      },
      { accessorKey: "uploaded_by", header: "Uploaded by", size: 200 },
    ],
    []
  );

  function rowActions(row: ModulePackage): DataTableRowAction[] {
    const actions: DataTableRowAction[] = [
      { key: "log", label: "View log", onClick: () => setSelectedUuid(row.uuid) },
    ];
    if (row.status === "uploaded" || row.status === "failed") {
      actions.push({
        key: "replace",
        label: "Replace zip",
        onClick: () => startReplace(row),
      });
      actions.push({
        key: "promote",
        label: row.status === "failed" ? "Retry promote" : "Promote",
        onClick: () => setPendingPromote(row),
      });
    }
    if (row.status === "promoting" || row.status === "installing") {
      actions.push({
        key: "cancel",
        label: isPromoteStuckQueued(row) ? "Cancel stuck promote" : "Cancel promote",
        onClick: () => setPendingCancel(row),
      });
    }
    if (row.status === "pr_open") {
      actions.push({
        key: "discard",
        label: "Discard PRs",
        onClick: () => setPendingCancel(row),
      });
      actions.push({
        key: "mark-deployed",
        label: "Mark deployed",
        onClick: () => void markDeployed(row),
      });
    }
    if (row.status === "deployed") {
      actions.push({
        key: "activate",
        label: "Activate",
        onClick: () => setPendingActivate(row),
      });
    }
    return actions;
  }

  const failedHint =
    selected?.status === "failed" ? lastLogHint(selected.install_log) : null;

  return (
    <AppShell activeNavKey="platform-modules" navbar={navbar}>
      <Card className="mb-4">
        <CardHeader>
          <Upload className="h-4 w-4 text-erp-muted" aria-hidden />
          <CardTitle>Upload a package</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-[12px]">
          <label className="inline-flex items-center gap-2">
            <span className="text-erp-muted">Zip file</span>
            <input
              ref={fileInput}
              type="file"
              accept=".zip,application/zip"
              aria-label="Package zip"
              className="text-[12px]"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            size="sm"
            variant="primary"
            disabled={!file}
            loading={uploading}
            onClick={() => void upload()}
          >
            Upload
          </Button>
          <span className="text-erp-muted">
            Promote opens PRs → Mark deployed → Activate for every workspace
          </span>
        </CardContent>
      </Card>

      <input
        ref={replaceInput}
        type="file"
        accept=".zip,application/zip"
        aria-label="Replace package zip"
        className="hidden"
        onChange={(event) => void onReplaceFileChosen(event)}
      />

      <DataTable
        tableId="platform-packages"
        columns={columns}
        data={packages}
        loading={loading}
        error={packages.length > 0 ? null : error}
        getRowId={(row) => row.uuid}
        getRowActions={rowActions}
        pagination={false}
        emptyMessage="No packages uploaded yet."
      />

      {selected ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              {selected.label} {selected.version} — promote log
            </CardTitle>
            <span className="ms-auto">
              {(() => {
                const badge = STATUS_BADGE[selected.status];
                return <StatusBadge status={badge.status} label={badge.label} />;
              })()}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected.status === "failed" ? (
              <p className="m-0 text-[12px] text-erp-muted">
                Promote failed
                {failedHint ? `: ${failedHint}` : ""}. Use{" "}
                <span className="font-medium text-erp-text">Replace zip</span> if the
                artifact was wrong, or{" "}
                <span className="font-medium text-erp-text">Retry promote</span> for a
                transient error.
              </p>
            ) : null}
            {selected.status === "promoting" || selected.status === "installing" ? (
              <p className="m-0 text-[12px] text-erp-muted">
                {isPromoteStuckQueued(selected)
                  ? "Still queued — the worker may not have started. Cancel stuck promote, then Promote again."
                  : "Promote in progress. Cancel only if you are sure the worker is stuck."}
              </p>
            ) : null}
            {selected.status === "pr_open" ? (
              <p className="m-0 text-[12px] text-erp-muted">
                PRs are open. Mark deployed after merge, or{" "}
                <span className="font-medium text-erp-text">Discard PRs</span> to reset to
                Uploaded and Promote again (e.g. after fixing the zip).
              </p>
            ) : null}
            {(selected.backend_pr_url || selected.frontend_pr_url) && (
              <div className="flex flex-wrap gap-3 text-[12px]">
                {selected.backend_pr_url ? (
                  <a
                    href={selected.backend_pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-erp-blue hover:underline"
                  >
                    Backend PR
                  </a>
                ) : null}
                {selected.frontend_pr_url ? (
                  <a
                    href={selected.frontend_pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-erp-blue hover:underline"
                  >
                    Frontend PR
                  </a>
                ) : null}
              </div>
            )}
            <pre
              className="m-0 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-erp-text"
              aria-label="Install log"
            >
              {selected.install_log || "Not promoted yet."}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingPromote !== null}
        title={
          pendingPromote
            ? `Promote ${pendingPromote.label} ${pendingPromote.version}?`
            : ""
        }
        description={
          pendingPromote?.status === "failed"
            ? "Retries the same zip. If the check failed because the artifact was wrong, cancel and use Replace zip first."
            : "Opens pull requests on the backend and frontend repos. It does not activate tenants until you Mark deployed and Activate after merge."
        }
        confirmLabel="Promote"
        variant="primary"
        onCancel={() => setPendingPromote(null)}
        onConfirm={() => {
          if (pendingPromote) void promote(pendingPromote);
        }}
      />

      <ConfirmDialog
        open={pendingCancel !== null}
        title={
          pendingCancel
            ? pendingCancel.status === "pr_open"
              ? `Discard PRs for ${pendingCancel.label} ${pendingCancel.version}?`
              : `Cancel promote for ${pendingCancel.label} ${pendingCancel.version}?`
            : ""
        }
        description={
          pendingCancel?.status === "pr_open"
            ? "Closes the promote PRs on GitHub (best effort), resets promote branches, and sets the package back to Uploaded so you can Replace zip and Promote again."
            : "Resets the package to Uploaded. A worker already running may still finish and overwrite this — use Cancel mainly when the log is stuck on queued."
        }
        confirmLabel={
          pendingCancel?.status === "pr_open" ? "Discard PRs" : "Cancel promote"
        }
        variant="danger"
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => {
          if (pendingCancel) void cancel(pendingCancel);
        }}
      />

      <ConfirmDialog
        open={pendingActivate !== null}
        title={
          pendingActivate
            ? `Activate ${pendingActivate.label} ${pendingActivate.version}?`
            : ""
        }
        description="Switches the module on for every workspace. Members get no access until a role grants it; each workspace's admin role receives its permissions."
        confirmLabel="Activate"
        variant="primary"
        onCancel={() => setPendingActivate(null)}
        onConfirm={() => {
          if (pendingActivate) void activate(pendingActivate);
        }}
      />
    </AppShell>
  );
}
