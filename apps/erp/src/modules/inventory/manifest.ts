import { lazy } from "react";
import { Package } from "lucide-react";
import type { ModuleManifest } from "../types";

export const inventorySubmenu = [
  {
    key: "products",
    label: "Products",
    href: "/inventory/products",
    children: [
      { key: "expirations", label: "Expirations", href: "/inventory/products" },
      { key: "movements", label: "Stock Movements", href: "/inventory/movements" },
    ],
  },
  { key: "movements", label: "Stock Movements", href: "/inventory/movements" },
];

export const inventoryNavbar = {
  brandLabel: "Inventory",
  submenuItems: inventorySubmenu,
};

export const inventoryManifest: ModuleManifest = {
  // The reserved `al_inv_` prefix and the `inv.*` permission codes name the
  // backend key. No backend module ships it yet, so no tenant lists it in
  // enabled_modules and this scaffold stays behind the registry filter.
  key: "inv",
  navArea: "operations",
  id: "inventory",
  label: "Inventory",
  version: "0.1.0",
  description: "Products catalog and stock movements.",
  icon: Package,
  path: "/inventory",
  nav: {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    href: "/inventory/products",
    children: [
      { key: "products", label: "Products", href: "/inventory/products" },
      { key: "movements", label: "Stock movements", href: "/inventory/movements" },
    ],
  },
  submenu: inventorySubmenu,
  Routes: lazy(() =>
    import("./routes").then((module) => ({ default: module.InventoryRoutes }))
  ),
};

export default inventoryManifest;
