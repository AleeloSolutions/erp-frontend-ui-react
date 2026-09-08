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
 * `Routes` is loaded lazily (`React.lazy`), so a tenant never downloads
 * the chunks of a module it has not installed.
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
  /** The module's route tree, mounted at `${path}/*`. */
  Routes: ComponentType;
}

/** @deprecated Use `ModuleManifest`; kept so existing imports keep compiling. */
export type ErpModule = ModuleManifest;
