import { LayoutDashboard, Home, ListTodo, MoreHorizontal, Settings } from "lucide-react";
import type { MobileNavItem, NavigationItem } from "@erp/ui";
// import { inventoryManifest } from "@/modules/inventory/manifest";
import { salesManifest } from "@/modules/sales";

export const coreNavigation: NavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    children: [
      { key: "tasks", label: "Tasks", href: "/dashboard" },
      { key: "announcements", label: "Announcements", href: "/dashboard" },
      { key: "shortcuts", label: "Shortcuts", href: "/dashboard" },
    ],
  },
  salesManifest.nav,
  // Statement Reports is deliberately absent: the three statements rendered
  // hardcoded figures with no backend behind them. The module is gone; the
  // renderer lives on as `AccountReport` in @erp/ui, with the statements as
  // its fixtures.
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export const navigation: NavigationItem[] = coreNavigation;

export const financeSubmenu = [
  { key: "invoices", label: "Customer invoices", href: "/" },
  { key: "payments", label: "Customer payments", href: "/" },
  { key: "statements", label: "Customer statements", href: "/" },
  { key: "creditnotes", label: "Credit notes", href: "/" },
  { key: "accounts", label: "Chart of accounts", href: "/" },
];

export const mobileNavigation: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/inventory/products", icon: Home },
  { key: "tasks", label: "Tasks", href: "/dashboard", icon: ListTodo },
  { key: "more", label: "More", href: "/dashboard", icon: MoreHorizontal },
];
