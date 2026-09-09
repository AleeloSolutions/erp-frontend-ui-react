import {
  Boxes,
  LayoutDashboard,
  Home,
  ListTodo,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import type { MobileNavItem, NavigationItem } from "@erp/ui";
import { enabledModules, type ModuleManifest } from "@/modules";
import { getModules } from "@/modules/registry";
import { holdsAny, NAV_REQUIREMENTS, navRequirementFor } from "./access";
import type { Session } from "./session";

/**
 * The sidebar areas, in the order they appear between the dashboard and
 * settings. A module names its area in its manifest (`navArea`); an area
 * nobody has a module in simply does not render, and a module naming an
 * area not listed here lands after the known ones.
 */
export const NAV_AREAS = ["sales", "operations", "finance", "people"] as const;

export const dashboardNavigation: NavigationItem = {
  key: "dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  href: "/dashboard",
  children: [
    { key: "tasks", label: "Tasks", href: "/dashboard" },
    { key: "announcements", label: "Announcements", href: "/dashboard" },
    { key: "shortcuts", label: "Shortcuts", href: "/dashboard" },
  ],
};

export const settingsNavigation: NavigationItem = {
  key: "settings",
  label: "Settings",
  icon: Settings,
  href: "/settings",
};

/** Platform accounts only: the screen that installs module packages. */
export const platformNavigation: NavigationItem = {
  key: "platform-modules",
  label: "Module packages",
  icon: Boxes,
  href: "/platform/modules",
};

/**
 * The sidebar this session should be offered.
 *
 * Two filters, in order. A module is there only if the tenant has it
 * installed (`me.enabled_modules`, the SPA's single source for gating) --
 * that is the installer's doing, and nothing else. Then, like every other
 * entry, only if the account holds a code that gives it something to show.
 *
 * `modules` is the live registry by default: compiled-in modules plus the
 * packaged ones whose bundles have registered. While the session is still
 * unknown no module is offered, because "installed" is not something to
 * guess at; the platform entries render so the shell is never empty.
 * Statement Reports is deliberately absent: the module was retired, its
 * renderer lives on as `AccountReport`.
 */
export function buildNavigation(
  session: Pick<Session, "permissions" | "enabled_modules" | "user_type"> | null,
  modules: readonly ModuleManifest[] = getModules()
): NavigationItem[] {
  const codes = session?.permissions ?? null;
  const offered = enabledModules(session?.enabled_modules, modules).filter((module) =>
    holdsAny(codes, navRequirementFor(module))
  );
  const rank = (area: string) => {
    const index = (NAV_AREAS as readonly string[]).indexOf(area);
    return index === -1 ? NAV_AREAS.length : index;
  };
  const byArea = [...offered].sort((a, b) => rank(a.navArea) - rank(b.navArea));
  const isPlatform = session?.user_type === "platform";
  const platform = isPlatform ? [platformNavigation] : [];
  // Platform staff has no tenant: Settings (company, users, modules) 500s
  // without a client. Keep them on Module packages only.
  const settings = isPlatform ? [] : [settingsNavigation];

  return [
    dashboardNavigation,
    ...platform,
    ...byArea.map((module) => module.nav),
    ...settings,
  ].filter((item) => holdsAny(codes, NAV_REQUIREMENTS[item.key] ?? []));
}

/** The platform's own entries -- what the shell shows before a session
 * arrives, and what Storybook renders with no session at all. */
export const coreNavigation: NavigationItem[] = buildNavigation(null, []);

export const navigation: NavigationItem[] = coreNavigation;

export const financeSubmenu = [
  { key: "invoices", label: "Customer invoices", href: "/" },
  { key: "payments", label: "Customer payments", href: "/" },
  { key: "statements", label: "Customer statements", href: "/" },
  { key: "creditnotes", label: "Credit notes", href: "/" },
  { key: "accounts", label: "Chart of accounts", href: "/" },
];

export const mobileNavigation: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/dashboard", icon: Home },
  { key: "tasks", label: "Tasks", href: "/dashboard", icon: ListTodo },
  { key: "more", label: "More", href: "/dashboard", icon: MoreHorizontal },
];
