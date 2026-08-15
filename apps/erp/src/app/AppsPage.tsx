import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { LayoutGrid } from "lucide-react";
import { AppShell, PageHeader } from "@/app";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  useToast,
} from "@erp/ui";
import { useModuleRegistry, type ErpModule } from "@/modules";

export default function AppsPage() {
  const { toast } = useToast();
  const {
    catalog,
    isInstalled,
    install,
    uninstall,
    canInstall,
    canUninstall,
  } = useModuleRegistry();
  const [pendingUninstall, setPendingUninstall] = useState<ErpModule | null>(
    null
  );

  const columns = useMemo<ColumnDef<ErpModule>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Module",
        meta: { fill: true },
        cell: ({ row }) => {
          const Icon = row.original.icon;
          return (
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-gradient-to-br from-[#2F6FB3] to-erp-blue text-white shadow-[0_3px_8px_rgba(30,78,140,0.14)]">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-erp-text">{row.original.label}</div>
                <div className="text-[11px] text-erp-muted">
                  {row.original.description ?? row.original.path}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "version",
        header: "Version",
        size: 90,
      },
      {
        id: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) =>
          isInstalled(row.original.id) ? (
            <Badge variant="success">Installed</Badge>
          ) : (
            <Badge variant="default">Available</Badge>
          ),
      },
      {
        id: "__actions",
        header: "",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => {
          const mod = row.original;
          const installed = isInstalled(mod.id);

          if (installed) {
            const check = canUninstall(mod.id);
            return (
              <Button
                variant="secondary"
                size="sm"
                disabled={!check.ok}
                title={check.ok ? undefined : check.reason}
                onClick={() => setPendingUninstall(mod)}
              >
                Uninstall
              </Button>
            );
          }

          const check = canInstall(mod.id);
          return (
            <Button
              variant="primary"
              size="sm"
              disabled={!check.ok}
              title={check.ok ? undefined : check.reason}
              onClick={() => {
                try {
                  install(mod.id);
                  toast({
                    title: "Module installed",
                    description: `${mod.label} is now available in the sidebar.`,
                    variant: "success",
                  });
                } catch (error) {
                  toast({
                    title: "Install failed",
                    description:
                      error instanceof Error ? error.message : "Unknown error",
                    variant: "error",
                  });
                }
              }}
            >
              Install
            </Button>
          );
        },
      },
    ],
    [canInstall, canUninstall, install, isInstalled, toast]
  );

  return (
    <AppShell activeNavKey="apps" activeMobileKey="more">
      <PageHeader
        module="Platform"
        section="Apps"
        title="Apps"
        description="Install or uninstall ERP modules. Uninstall hides them from navigation and routes; code and data stay in the project."
        icon={<LayoutGrid className="h-4 w-4" aria-hidden />}
      />

      <DataTable columns={columns} data={catalog} searchable pageSize={10} />

      <ConfirmDialog
        open={Boolean(pendingUninstall)}
        title={`Uninstall ${pendingUninstall?.label ?? "module"}?`}
        description="The module will be hidden from the sidebar and its routes will stop working. Code and data are kept."
        confirmLabel="Uninstall"
        variant="danger"
        onCancel={() => setPendingUninstall(null)}
        onConfirm={() => {
          if (!pendingUninstall) return;
          try {
            uninstall(pendingUninstall.id);
            toast({
              title: "Module uninstalled",
              description: `${pendingUninstall.label} was removed from the sidebar.`,
              variant: "success",
            });
            setPendingUninstall(null);
          } catch (error) {
            toast({
              title: "Uninstall failed",
              description:
                error instanceof Error ? error.message : "Unknown error",
              variant: "error",
            });
          }
        }}
      />
    </AppShell>
  );
}
