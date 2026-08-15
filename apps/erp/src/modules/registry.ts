import type { ErpModule } from "./types";

const STORAGE_KEY = "erp.installedModules";

export const DEFAULT_INSTALLED_MODULES = ["sales", "inventory", "hr"] as const;

type ManifestModule = { default: ErpModule } | ErpModule;

const manifestModules = import.meta.glob("./*/manifest.ts", {
  eager: true,
}) as Record<string, ManifestModule>;

function resolveManifest(mod: ManifestModule): ErpModule {
  return "default" in mod ? mod.default : mod;
}

/** All modules discovered from each module folder manifest. */
export const moduleCatalog: ErpModule[] = Object.values(manifestModules)
  .map(resolveManifest)
  .sort((a, b) => a.label.localeCompare(b.label));

const catalogById = new Map(moduleCatalog.map((m) => [m.id, m]));

export function getModule(id: string): ErpModule | undefined {
  return catalogById.get(id);
}

export function getModuleOrThrow(id: string): ErpModule {
  const mod = getModule(id);
  if (!mod) {
    throw new Error(`Unknown module: ${id}`);
  }
  return mod;
}

export function readInstalledIds(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_INSTALLED_MODULES];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_INSTALLED_MODULES];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
      return [...DEFAULT_INSTALLED_MODULES];
    }
    return parsed.filter((id) => catalogById.has(id));
  } catch {
    return [...DEFAULT_INSTALLED_MODULES];
  }
}

export function writeInstalledIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getInstalledModules(installedIds: string[]): ErpModule[] {
  return installedIds
    .map((id) => catalogById.get(id))
    .filter((m): m is ErpModule => Boolean(m));
}

export function getMissingDependencies(
  moduleId: string,
  installedIds: string[]
): string[] {
  const mod = getModule(moduleId);
  if (!mod?.dependsOn?.length) return [];
  const installed = new Set(installedIds);
  return mod.dependsOn.filter((dep) => !installed.has(dep));
}

export function getDependents(
  moduleId: string,
  installedIds: string[]
): ErpModule[] {
  return getInstalledModules(installedIds).filter((m) =>
    m.dependsOn?.includes(moduleId)
  );
}

export function canInstall(
  moduleId: string,
  installedIds: string[]
): { ok: true } | { ok: false; reason: string } {
  if (!catalogById.has(moduleId)) {
    return { ok: false, reason: `Unknown module: ${moduleId}` };
  }
  if (installedIds.includes(moduleId)) {
    return { ok: false, reason: "Module is already installed." };
  }
  const missing = getMissingDependencies(moduleId, installedIds);
  if (missing.length) {
    const labels = missing.map((id) => getModule(id)?.label ?? id).join(", ");
    return {
      ok: false,
      reason: `Install required modules first: ${labels}`,
    };
  }
  return { ok: true };
}

export function canUninstall(
  moduleId: string,
  installedIds: string[]
): { ok: true } | { ok: false; reason: string } {
  const mod = getModule(moduleId);
  if (!mod) {
    return { ok: false, reason: `Unknown module: ${moduleId}` };
  }
  if (!installedIds.includes(moduleId)) {
    return { ok: false, reason: "Module is not installed." };
  }
  if (mod.required) {
    return { ok: false, reason: "This module is required and cannot be uninstalled." };
  }
  const dependents = getDependents(moduleId, installedIds);
  if (dependents.length) {
    const labels = dependents.map((d) => d.label).join(", ");
    return {
      ok: false,
      reason: `Uninstall dependent modules first: ${labels}`,
    };
  }
  return { ok: true };
}
