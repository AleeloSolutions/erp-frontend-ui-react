/**
 * The module icon allowlist.
 *
 * A module names its mark as a STRING (`"ShoppingCart"`), never as a
 * component: the backend stores that string on the module descriptor and
 * validates it against exactly this list, in this order, with the same
 * default. One contract, two repos.
 *
 * So the two copies can drift -- a backend deployed ahead of a frontend,
 * a tenant still on a cached bundle, a packaged module built against a
 * newer list. Drift has to be survivable: an unknown name resolves to
 * the default rather than throwing or rendering nothing. A module whose
 * icon this build has never heard of should look plain, not take the
 * Modules screen or the navbar down with it.
 *
 * This lives in the app rather than `packages/ui` because which marks an
 * ERP module may wear is a business rule, and the design system stays
 * free of those (AGENTS.md design rule 5).
 *
 * RESOLUTION ORDER -- what a module shows, in order:
 *   1. its logo IMAGE, once modules carry one. NOT IMPLEMENTED YET.
 *   2. its `icon` name, resolved here.
 *   3. `DEFAULT_MODULE_ICON`.
 * Only rungs 2 and 3 exist today. The image slots in ABOVE this module:
 * a caller holding an image renders that and never asks here, everyone
 * else keeps calling `resolveModuleIcon` unchanged. That path also wants
 * `NavigationItem.icon` widened to accept a rendered node the way
 * `SubmenuItem.icon` already is, plus an `isValidElement` branch in
 * `Sidebar.tsx`. Both are out of scope here and neither is touched.
 */

import {
  Banknote,
  Blocks,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  ChartLine,
  ClipboardList,
  Contact,
  CreditCard,
  Factory,
  FileText,
  Handshake,
  Landmark,
  LayoutDashboard,
  Package,
  PiggyBank,
  Receipt,
  Scan,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Name -> icon. Insertion order IS the contract order, which is what
 * `MODULE_ICON_NAMES` and the backend's choices list both read.
 */
export const MODULE_ICONS = {
  Banknote,
  Blocks,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  CalendarDays,
  ChartLine,
  ClipboardList,
  Contact,
  CreditCard,
  Factory,
  FileText,
  Handshake,
  Landmark,
  LayoutDashboard,
  Package,
  PiggyBank,
  Receipt,
  Scan,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} satisfies Record<string, LucideIcon>;

/** A name this build knows. Anything else is drift -- see the header. */
export type ModuleIconName = keyof typeof MODULE_ICONS;

/** The allowlist in contract order: what a picker would offer. */
export const MODULE_ICON_NAMES = Object.keys(MODULE_ICONS) as ModuleIconName[];

/** What a module with no icon -- or an icon this build cannot place -- wears. */
export const DEFAULT_MODULE_ICON_NAME = "Blocks" satisfies ModuleIconName;

export const DEFAULT_MODULE_ICON: LucideIcon = MODULE_ICONS[DEFAULT_MODULE_ICON_NAME];

/**
 * Own-property check, so `"constructor"` and friends are not names.
 */
export function isModuleIconName(value: unknown): value is ModuleIconName {
  return (
    typeof value === "string" && Object.prototype.hasOwnProperty.call(MODULE_ICONS, value)
  );
}

/**
 * Rung 2 of the resolution order: a module's `icon` name -> the icon to
 * render. Total by construction -- empty string, absent, and unknown all
 * land on `DEFAULT_MODULE_ICON`. It never throws and never returns
 * nothing to render, which is the whole point: see the header on drift.
 */
export function resolveModuleIcon(name: string | null | undefined): LucideIcon {
  return isModuleIconName(name) ? MODULE_ICONS[name] : DEFAULT_MODULE_ICON;
}
