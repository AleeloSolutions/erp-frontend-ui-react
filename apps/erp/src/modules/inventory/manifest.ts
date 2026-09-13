import { Package } from "lucide-react";
import type { ModuleManifest } from "../../../../apps/erp/src/modules/types";
import { InventoryRoutes } from "./routes";

export const inventorySubmenu = [
  { key: "items", label: "Items", href: "/inventory/items" },
  { key: "categories", label: "Categories", href: "/inventory/categories" },
  { key: "movements", label: "Movements", href: "/inventory/movements" },
];

export const inventoryNavbar = {
  brandLabel: "Inventory",
  submenuItems: inventorySubmenu,
};

export const inventoryManifest: ModuleManifest = {
  key: "inventory",
  navArea: "operations",
  id: "inventory",
  label: "Inventory",
  version: "1.0.0",
  description: "Items, categories, and stock movements.",
  icon: Package,
  path: "/inventory",
  nav: {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    href: "/inventory/items",
    children: inventorySubmenu,
  },
  submenu: inventorySubmenu,
  resources: ["inventory.item", "inventory.category", "inventory.movement"],
  Routes: InventoryRoutes,
};

export default inventoryManifest;
