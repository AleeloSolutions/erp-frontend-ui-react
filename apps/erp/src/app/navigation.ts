import { LayoutDashboard, Home, ListTodo, MoreHorizontal, Settings } from "lucide-react";
import type { MobileNavItem, NavigationItem } from "@erp/ui";
import { enabledModules } from "@/modules";
import { holdsAny, NAV_REQUIREMENTS } from "./access";
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

/**
 * The sidebar this session should be offered.
 *
 * Two filters, in order. A module is there only if the tenant has it
 * installed (`me.enabled_modules`, the SPA's single source for gating) --
 * that is the installer's doing, and nothing else. Then, like every other
 * entry, only if the account holds a code that gives it something to show.
 *
 * While the session is still unknown no module is offered, because
 * "installed" is not something to guess at; the platform entries render
 * so the shell is never empty. Statement Reports is deliberately absent:
 * the module was retired, its renderer lives on as `AccountReport`.
 */
export function buildNavigation(
  session: Pick<Session, "permissions" | "enabled_modules"> | null
): NavigationItem[] {
  const codes = session?.permissions ?? null;
  const modules = enabledModules(session?.enabled_modules).filter((module) =>
    holdsAny(codes, NAV_REQUIREMENTS[module.nav.key] ?? [])
  );
  const rank = (area: string) => {
    const index = (NAV_AREAS as readonly string[]).indexOf(area);
    return index === -1 ? NAV_AREAS.length : index;
  };
  const byArea = [...modules].sort((a, b) => rank(a.navArea) - rank(b.navArea));

  return [
    dashboardNavigation,
    ...byArea.map((module) => module.nav),
    settingsNavigation,
  ].filter((item) => holdsAny(codes, NAV_REQUIREMENTS[item.key] ?? []));
}

/** The platform's own entries -- what the shell shows before a session
 * arrives, and what Storybook renders with no session at all. */
export const coreNavigation: NavigationItem[] = buildNavigation(null);

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
