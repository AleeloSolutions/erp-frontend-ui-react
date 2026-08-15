import {
  LayoutDashboard,
  BarChart3,
  Home,
  ListTodo,
  PlusCircle,
  MoreHorizontal,
  LayoutGrid,
} from "lucide-react";
import type { MobileNavItem, NavigationItem } from "@erp/ui";

/** Core nav items always shown (not toggled via Apps). */
export const coreNavigation: NavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/components-demo",
    children: [
      { key: "tasks", label: "Tasks", href: "/components-demo" },
      { key: "announcements", label: "Announcements", href: "/components-demo" },
      { key: "shortcuts", label: "Shortcuts", href: "/components-demo" },
    ],
  },
  {
    key: "apps",
    label: "Apps",
    icon: LayoutGrid,
    href: "/apps",
  },
];

/** @deprecated Prefer building nav from ModuleRegistryProvider. Kept for demos. */
export const navigation: NavigationItem[] = coreNavigation;

export const financeSubmenu = [
  { key: "invoices", label: "Customer invoices", href: "/components-demo" },
  { key: "payments", label: "Customer payments", href: "/components-demo" },
  { key: "statements", label: "Customer statements", href: "/components-demo" },
  { key: "creditnotes", label: "Credit notes", href: "/components-demo" },
  { key: "accounts", label: "Chart of accounts", href: "/components-demo" },
];

export const mobileNavigation: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "tasks", label: "Tasks", href: "/components-demo", icon: ListTodo },
  { key: "create", label: "Create", href: "/components-demo", icon: PlusCircle },
  { key: "reports", label: "Reports", href: "/components-demo", icon: BarChart3 },
  { key: "more", label: "More", href: "/components-demo", icon: MoreHorizontal },
];
