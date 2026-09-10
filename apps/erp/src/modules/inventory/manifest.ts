import { Boxes } from "lucide-react";
import type { ModuleManifest } from "../../../../kaabe-frontend/apps/erp/src/modules/types";
import { InventoryRoutes } from "./routes";

export const inventorySubmenu = [
  { key: "items", label: "Items", href: "/inventory/items" },
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
  description: "Stock items for this workspace.",
  icon: Boxes,
  path: "/inventory",
  nav: {
    key: "inventory",
    label: "Inventory",
    icon: Boxes,
    href: "/inventory/items",
    children: inventorySubmenu,
  },
  submenu: inventorySubmenu,
  resources: ["inventory.item"],
  Routes: InventoryRoutes,
};

export default inventoryManifest;
