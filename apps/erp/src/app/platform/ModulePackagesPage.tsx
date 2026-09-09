/**
 * Platform → Module packages: the senior's screen.
 *
 * Upload a module zip, install it, watch the pipeline's log land. An
 * install runs on the server (checks, unpack, migrate, activate for every
 * tenant, reload); the list polls while it runs. Platform accounts only
 * (RequirePlatform, and the API's own 404).
 */

import { useEffect, useMemo, useRef, useState } from "react";
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
  installPackage,
  uploadPackage,
  usePackages,
  type ModulePackage,
  type PackageStatus,
} from "./packagesApi";

const STATUS_BADGE: Record<PackageStatus, { status: string; label: string }> = {
  uploaded: { status: "draft", label: "Uploaded" },
  installing: { status: "pending", label: "Installing" },
  installed: { status: "active", label: "Installed" },
  failed: { status: "overdue", label: "Failed" },
  superseded: { status: "inactive", label: "Superseded" },
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function ModulePackagesPage() {
  const navbar = useNavbarDefaults({ brandLabel: "Platform" });
  const { toast } = useToast();
  const { packages, loading, error, reload } = usePackages();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingInstall, setPendingInstall] = useState<ModulePackage | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const selected = packages.find((row) => row.uuid === selectedUuid) ?? null;
  const seenStatus = useRef<Record<string, PackageStatus>>({});

  // Toast when a pipeline finishes: start only said "Installing…", so success
  // / failure need their own message once the polled status lands.
  useEffect(() => {
    for (const row of packages) {
      const previous = seenStatus.current[row.uuid];
      seenStatus.current[row.uuid] = row.status;
      if (previous !== "installing") continue;
      if (row.status === "installed") {
        toast({
          title: `${row.label} ${row.version} installed`,
          description: "Switched on for every workspace.",
          variant: "success",
        });
      } else if (row.status === "failed") {
        toast({
          title: `${row.label} ${row.version} failed to install`,
          description: "Open the install log for detail.",
          variant: "error",
        });
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
        description: "Checked and stored. Install it when you are ready.",
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

  async function install(row: ModulePackage) {
    try {
      await installPackage(row.uuid);
      toast({
        title: `Installing ${row.label} ${row.version}`,
        description: "The log below follows the pipeline.",
        variant: "info",
      });
      setPendingInstall(null);
      setSelectedUuid(row.uuid);
      reload();
    } catch (err) {
      reportFailure(err, `Could not start installing ${row.label}`);
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
        id: "frontend",
        header: "Frontend",
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (row.original.has_bundle ? "Bundle" : "—"),
      },
      {
        id: "installed_at",
        header: "Installed",
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
        key: "install",
        label: row.status === "failed" ? "Retry install" : "Install",
        onClick: () => setPendingInstall(row),
      });
    }
    return actions;
  }

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
            manifest.json, backend/apps/&lt;key&gt;/, frontend/module.js
          </span>
        </CardContent>
      </Card>

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
              {selected.label} {selected.version} — install log
            </CardTitle>
            <span className="ms-auto">
              {(() => {
                const badge = STATUS_BADGE[selected.status];
                return <StatusBadge status={badge.status} label={badge.label} />;
              })()}
            </span>
          </CardHeader>
          <CardContent>
            <pre
              className="m-0 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-erp-text"
              aria-label="Install log"
            >
              {selected.install_log || "Not installed yet."}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingInstall !== null}
        title={
          pendingInstall
            ? `Install ${pendingInstall.label} ${pendingInstall.version}?`
            : ""
        }
        description="Its migrations run now and it is switched on for every workspace. Members get no access until a role grants it; each workspace's admin role receives its permissions."
        confirmLabel="Install"
        variant="primary"
        onCancel={() => setPendingInstall(null)}
        onConfirm={() => {
          if (pendingInstall) void install(pendingInstall);
        }}
      />
    </AppShell>
  );
}
