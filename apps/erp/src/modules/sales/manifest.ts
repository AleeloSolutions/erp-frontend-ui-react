import { lazy } from "react";
import { ShoppingCart } from "lucide-react";
import type { ModuleManifest } from "../types";

export const salesSubmenu = [
  { key: "customers", label: "Customers", href: "/sales/customers" },
  { key: "quotations", label: "Quotations", href: "/sales/quotations" },
  { key: "invoices", label: "Invoices", href: "/sales/invoices" },
  { key: "contracts", label: "Contracts", href: "/sales/contracts" },
  { key: "orders", label: "Sales orders", href: "/sales/orders" },
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
  description: "Customers, quotations, contracts, and sales orders.",
  icon: ShoppingCart,
  path: "/sales",
  nav: {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    href: "/sales/customers",
    children: [
      { key: "customers", label: "Customers", href: "/sales/customers" },
      { key: "quotations", label: "Quotations", href: "/sales/quotations" },
      { key: "invoices", label: "Invoices", href: "/sales/invoices" },
      { key: "contracts", label: "Contracts", href: "/sales/contracts" },
      { key: "orders", label: "Sales orders", href: "/sales/orders" },
    ],
  },
  submenu: salesSubmenu,
  // Its own chunk: a tenant without sales never downloads these screens.
  Routes: lazy(() =>
    import("./routes").then((module) => ({ default: module.SalesRoutes }))
  ),
};

export default salesManifest;
