import { Receipt } from "lucide-react";
import type { ModuleManifest } from "../../../../apps/erp/src/modules/types";
import { PosRoutes } from "./routes";

/**
 * Frontend half of the backend descriptor
 * (kaabe-backend/examples/pos/backend/apps/pos/module.py). Same shape as
 * `apps/erp/src/modules/sales/manifest.ts`. Packaged modules register this
 * at runtime (`registerModule`); they do not use `React.lazy` inside the
 * host build.
 */
export const posSubmenu = [{ key: "tickets", label: "Tickets", href: "/pos/tickets" }];

export const posNavbar = {
  brandLabel: "Point of Sale",
  submenuItems: posSubmenu,
};

export const posManifest: ModuleManifest = {
  key: "pos",
  navArea: "sales",
  id: "pos",
  label: "Point of Sale",
  version: "1.0.0",
  description: "Tickets rung up at the till.",
  icon: Receipt,
  path: "/pos",
  nav: {
    key: "pos",
    label: "Point of Sale",
    icon: Receipt,
    href: "/pos/tickets",
    children: posSubmenu,
  },
  submenu: posSubmenu,
  resources: ["pos.ticket"],
  Routes: PosRoutes,
};

export default posManifest;
