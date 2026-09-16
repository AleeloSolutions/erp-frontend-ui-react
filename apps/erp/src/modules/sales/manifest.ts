import { lazy } from "react";
import { ShoppingCart } from "lucide-react";
import type { ModuleManifest } from "../types";

/**
 * Visible Sales tabs. Invoices and contracts stay in the codebase/API but
 * are hidden from the product UI until we turn them back on.
 */
export const salesSubmenu = [
  { key: "customers", label: "Customers", href: "/sales/customers" },
  { key: "products", label: "Products", href: "/sales/products" },
  { key: "settings", label: "Settings", href: "/settings#sales" },
];

export const salesNavbar = {
  brandLabel: "Sales",
  submenuItems: salesSubmenu,
};

export const salesManifest: ModuleManifest = {
  // The backend module key (apps/sales/module.py); see me.enabled_modules.
  key: "sales",
  navArea: "sales",
  id: "sales",
  label: "Sales",
  version: "0.1.0",
  description: "Customers, sales, and products.",
  icon: ShoppingCart,
  path: "/sales",
  nav: {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    // Module home — the brand in the Sales navbar, not a submenu tab.
    href: "/sales",
    children: [
      { key: "customers", label: "Customers", href: "/sales/customers" },
      { key: "products", label: "Products", href: "/sales/products" },
      { key: "settings", label: "Settings", href: "/settings#sales" },
    ],
  },
  submenu: salesSubmenu,
  // Its own chunk: a tenant without sales never downloads these screens.
  Routes: lazy(() =>
    import("./routes").then((module) => ({ default: module.SalesRoutes }))
  ),
};

export default salesManifest;
