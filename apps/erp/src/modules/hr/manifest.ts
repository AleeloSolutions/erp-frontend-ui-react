import { Users } from "lucide-react";
import type { ErpModule } from "../types";
import { VendorsRoutes } from "./routes";

export const vendorsSubmenu = [
  { key: "vendors", label: "Vendors", href: "/vendors" },
  { key: "suppliers", label: "Suppliers", href: "/vendors" },
];

export const hrManifest: ErpModule = {
  id: "hr",
  label: "Vendors",
  version: "0.1.0",
  description: "Vendors and supplier contacts.",
  icon: Users,
  path: "/vendors",
  nav: {
    key: "vendors",
    label: "Vendors",
    icon: Users,
    href: "/vendors",
  },
  submenu: vendorsSubmenu,
  Routes: VendorsRoutes,
};

export default hrManifest;
