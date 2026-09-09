import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { NavigationItem, SubmenuItem } from "@erp/ui";

/**
 * What a module tells the app about itself -- the frontend half of the
 * backend's `ModuleDescriptor` (apps/<key>/module.py).
 *
 * `key` matches the backend module key exactly: it is what
 * `me.enabled_modules` lists, so it decides whether the module's nav
 * entry and routes exist for this tenant at all. `navArea` names the
 * sidebar area the module's entry is placed under.
 *
 * A module compiled into this build loads its `Routes` lazily
 * (`React.lazy`), so a tenant never downloads the chunks of a module it
 * has not installed. A module that arrived as a package registers the
 * same shape at runtime through `KaabeRuntime.registerModule`.
 */
export interface ModuleManifest {
  /** Backend module key (`sales`, `inv`, ...): what `enabled_modules` carries. */
  key: string;
  /** Sidebar area the module sits in (`sales`, `operations`, ...). */
  navArea: string;
  id: string;
  label: string;
  version: string;
  description?: string;
  icon: LucideIcon;
  /** URL prefix the module mounts at (`/sales`). */
  path: string;
  nav: NavigationItem;
  submenu?: SubmenuItem[];
  /**
   * The permission resources behind the module's screens (`pos.ticket`).
   * A module compiled into the build has its codes listed in
   * `app/access.ts`; a packaged one names its resources here, and holding
   * any rung of `view` on one of them is what makes its nav worth showing.
   */
  resources?: string[];
  /** The module's route tree, mounted at `${path}/*`. */
  Routes: ComponentType;
}

/** @deprecated Use `ModuleManifest`; kept so existing imports keep compiling. */
export type ErpModule = ModuleManifest;
