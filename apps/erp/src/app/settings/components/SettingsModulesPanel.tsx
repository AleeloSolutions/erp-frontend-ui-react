/**
 * Settings → Modules: the installer.
 *
 * One card per module this release ships, over `/api/v1/modules/`, with
 * the tenant's state on it. Installing seeds the module's defaults and
 * lights it up everywhere at once -- sidebar, routes, the permission
 * matrix -- because the session is refreshed the moment the call
 * succeeds. Disabling is a soft-off: the screens and permissions hide,
 * nothing is deleted, and re-enabling brings it back as it was. A module
 * that others depend on cannot be disabled first; the API says which.
 *
 * Only someone holding `settings.module.edit` sees the buttons at all;
 * everyone with the view tick sees the state.
 */

import { useContext, useMemo, useState } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { Blocks } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  StatusBadge,
  useToast,
} from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import {
  MODULE_CODES,
  disableModule,
  installModule,
  invalidateAfterModuleChange,
  useModules,
  type ModuleEntry,
} from "../modulesApi";
import { useCurrentUser } from "../usersApi";

/** How the three states read on a card. */
const STATUS_BADGE: Record<ModuleEntry["status"], { status: string; label: string }> = {
  available: { status: "draft", label: "Available" },
  installed: { status: "active", label: "Installed" },
  disabled: { status: "inactive", label: "Disabled" },
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function SettingsModulesPanel() {
  const { toast } = useToast();
  const me = useCurrentUser();
  // undefined outside a QueryProvider (Storybook): then only the session
  // and the plain-state hooks are refreshed, which is everything they use.
  const queryClient = useContext(QueryClientContext) ?? null;
  const { modules, loading, error, reload } = useModules();
  const [pendingDisable, setPendingDisable] = useState<ModuleEntry | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const canEdit = (me?.permissions ?? []).includes(MODULE_CODES.edit);

  const installed = useMemo(
    () =>
      new Set(
        modules.filter((module) => module.status === "installed").map((m) => m.key)
      ),
    [modules]
  );
  const labelOf = (key: string) =>
    modules.find((module) => module.key === key)?.label ?? key;

  function reportFailure(err: unknown, fallback: string) {
    toast({
      title: fallback,
      description: err instanceof ApiError ? err.message : "Please try again.",
      variant: "error",
    });
  }

  /** What every successful change does: the list, the session (sidebar,
   * route guards), and the cached copies of `me` and the matrix. */
  async function settle() {
    await invalidateAfterModuleChange(queryClient);
    reload();
  }

  async function install(module: ModuleEntry) {
    setBusyKey(module.key);
    try {
      await installModule(module.key);
      toast({
        title:
          module.status === "disabled"
            ? `${module.label} re-enabled`
            : `${module.label} installed`,
        description: "Its screens and permissions are available now.",
        variant: "success",
      });
      await settle();
    } catch (err) {
      reportFailure(err, `Could not install ${module.label}`);
    } finally {
      setBusyKey(null);
    }
  }

  async function disable(module: ModuleEntry) {
    setBusyKey(module.key);
    try {
      await disableModule(module.key);
      toast({
        title: `${module.label} disabled`,
        description: "Its screens and permissions are hidden. Nothing was deleted.",
        variant: "success",
      });
      setPendingDisable(null);
      await settle();
    } catch (err) {
      reportFailure(err, `Could not disable ${module.label}`);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div role="tabpanel" aria-label="Modules">
      <div className="overflow-hidden rounded-sm border border-erp-border-soft bg-white">
        <div className="border-b border-erp-border bg-erp-header px-4 py-2.5">
          <h2 className="m-0 text-[13px] font-bold text-erp-text">Modules</h2>
        </div>
        <div className="bg-white p-6">
          {error ? (
            <p className="m-0 text-[12px] text-erp-error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div
              className="grid gap-4 min-[721px]:grid-cols-2 min-[1100px]:grid-cols-3"
              aria-busy="true"
            >
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-lg bg-erp-border"
                />
              ))}
              <span className="sr-only">Loading modules</span>
            </div>
          ) : modules.length === 0 && !error ? (
            <p className="m-0 text-[12px] text-erp-muted">
              No modules are available yet.
            </p>
          ) : (
            <div className="grid gap-4 min-[721px]:grid-cols-2 min-[1100px]:grid-cols-3">
              {modules.map((module) => {
                const badge = STATUS_BADGE[module.status];
                const missing = module.depends_on.filter((key) => !installed.has(key));
                const busy = busyKey === module.key;
                const installedOn = formatDate(module.installed_at);
                return (
                  <Card key={module.key} data-module={module.key}>
                    <CardHeader>
                      <Blocks className="h-4 w-4 shrink-0 text-erp-muted" aria-hidden />
                      <CardTitle className="min-w-0 flex-1 truncate">
                        {module.label}
                      </CardTitle>
                      <StatusBadge status={badge.status} label={badge.label} />
                    </CardHeader>
                    <CardContent className="space-y-2 text-[12px] text-erp-muted">
                      <div>
                        Version {module.version}
                        {installedOn ? ` · installed ${installedOn}` : ""}
                      </div>
                      {module.depends_on.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>Requires</span>
                          {module.depends_on.map((key) => (
                            <Badge
                              key={key}
                              variant={installed.has(key) ? "success" : "warning"}
                            >
                              {labelOf(key)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {module.status === "disabled" ? (
                        <div>
                          Its data is kept; re-enable it to pick up where it left off.
                        </div>
                      ) : null}
                    </CardContent>
                    {canEdit ? (
                      <CardFooter className="justify-between">
                        {module.status === "installed" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() => setPendingDisable(module)}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            loading={busy}
                            disabled={missing.length > 0}
                            onClick={() => void install(module)}
                          >
                            {module.status === "disabled" ? "Re-enable" : "Install"}
                          </Button>
                        )}
                        {missing.length > 0 && module.status !== "installed" ? (
                          <span className="text-[11px] text-erp-muted">
                            Install {missing.map(labelOf).join(", ")} first
                          </span>
                        ) : null}
                      </CardFooter>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDisable !== null}
        title={pendingDisable ? `Disable ${pendingDisable.label}?` : ""}
        description={
          pendingDisable
            ? `${pendingDisable.label}'s screens and permissions are hidden until it is re-enabled. Nothing is deleted.`
            : ""
        }
        confirmLabel="Disable"
        variant="danger"
        loading={pendingDisable !== null && busyKey === pendingDisable.key}
        onCancel={() => setPendingDisable(null)}
        onConfirm={() => {
          if (pendingDisable) void disable(pendingDisable);
        }}
      />
    </div>
  );
}
