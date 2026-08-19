import { Package } from "lucide-react";
import type { ErpModule } from "../types";
import { InventoryRoutes } from "./routes";

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
export const inventoryManifest: ErpModule = {
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
  Routes: InventoryRoutes,
};

export default inventoryManifest;
