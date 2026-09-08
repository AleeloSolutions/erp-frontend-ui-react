/**
 * The module registry: every business module compiled into this build.
 *
 * Registering a module is one entry here. Whether a tenant actually gets
 * it is decided by `me.enabled_modules` -- `app/navigation.ts` builds the
 * sidebar from the registry filtered by it, and `routes.tsx` mounts each
 * module's lazy routes behind `RequireModule`. Inventory sits here with
 * no backend module yet, so it is never in `enabled_modules` and shows
 * nowhere; the day its backend ships it lights up without a code change.
 */

import { inventoryManifest } from "./inventory/manifest";
import { salesManifest } from "./sales/manifest";
import type { ModuleManifest } from "./types";

export type { ErpModule, ModuleManifest } from "./types";

export const moduleRegistry: ModuleManifest[] = [salesManifest, inventoryManifest];

/** The registry entries a tenant has switched on, in registry order. */
export function enabledModules(
  enabledKeys: readonly string[] | null | undefined
): ModuleManifest[] {
  if (!enabledKeys) return [];
  return moduleRegistry.filter((module) => enabledKeys.includes(module.key));
}
