import { ShoppingCart } from "lucide-react";
import type { ErpModule } from "../types";
import { SalesRoutes } from "./routes";

export const salesSubmenu = [
  { key: "customers", label: "Customers", href: "/sales/customers" },
  { key: "quotations", label: "Quotations", href: "/sales/quotations" },
  { key: "contracts", label: "Contracts", href: "/sales/contracts" },
  { key: "orders", label: "Sales orders", href: "/components-demo" },
];

export const salesManifest: ErpModule = {
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
      { key: "contracts", label: "Contracts", href: "/sales/contracts" },
      { key: "orders", label: "Sales orders", href: "/sales/orders" },
    ],
  },
  submenu: salesSubmenu,
  Routes: SalesRoutes,
};

export default salesManifest;
