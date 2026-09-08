/**
 * The module registry: every business module compiled into this build.
 *
 * Registering a compiled-in module is one entry here. Modules that arrive
 * as packages register themselves at runtime (`modules/registry.ts`);
 * `useModules()` there is the union, and it is what the sidebar and the
 * routes read. Whether a tenant actually gets a module is decided by
 * `me.enabled_modules`. Inventory sits here with no backend module yet,
 * so it is never in `enabled_modules` and shows nowhere; the day its
 * backend ships it lights up without a code change.
 */

import { inventoryManifest } from "./inventory/manifest";
import { salesManifest } from "./sales/manifest";
import type { ModuleManifest } from "./types";

export type { ErpModule, ModuleManifest } from "./types";

export const moduleRegistry: ModuleManifest[] = [salesManifest, inventoryManifest];

/** The entries of `modules` a tenant has switched on, in registry order. */
export function enabledModules(
  enabledKeys: readonly string[] | null | undefined,
  modules: readonly ModuleManifest[] = moduleRegistry
): ModuleManifest[] {
  if (!enabledKeys) return [];
  return modules.filter((module) => enabledKeys.includes(module.key));
}
