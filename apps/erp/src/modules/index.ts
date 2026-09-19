/**
 * The module registry: every business module compiled into this build.
 *
 * Registering a compiled-in module is one entry here. Modules that arrive
 * as packages register themselves at runtime (`modules/registry.ts`);
 * `useModules()` there is the union, and it is what the sidebar and the
 * routes read. Whether a tenant actually gets a module is decided by
 * `me.enabled_modules`.
 */

import type { ModuleManifest } from "./types";

export type { ErpModule, ModuleManifest } from "./types";

// Sales ships as a package (backend AGENTS.md, section 1c): its promote PR
// adds the manifest import above and the registry entry below.
// Sales ships as a package (backend AGENTS.md, section 1c): its promote PR
// adds the manifest import above and the registry entry below. Until then
// Settings shows it as a placeholder, saying Coming soon.
export const moduleRegistry: ModuleManifest[] = [];

/** The entries of `modules` a tenant has switched on, in registry order. */
export function enabledModules(
  enabledKeys: readonly string[] | null | undefined,
  modules: readonly ModuleManifest[] = moduleRegistry
): ModuleManifest[] {
  if (!enabledKeys) return [];
  return modules.filter((module) => enabledKeys.includes(module.key));
}
