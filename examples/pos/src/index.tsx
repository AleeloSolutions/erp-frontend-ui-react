/**
 * The POS module's bundle entry. Built with the module kit
 * (vite.config.ts) into `dist/module.js`, shipped in the package zip as
 * `frontend/module.js`, and loaded by the host SPA at runtime for every
 * tenant that has the module enabled.
 *
 * A bundle does exactly one thing on load: register its manifest -- the
 * same shape a compiled-in module declares (`apps/erp/src/modules/types.ts`).
 * From then on the host's sidebar, route table and guards treat it like
 * one. `key` and `resources` match the backend descriptor
 * (kaabe-backend/examples/pos/backend/apps/pos/module.py).
 */

import { Receipt } from "lucide-react";
import { registerModule } from "@kaabe/runtime";
import { PosRoutes } from "./routes";
import "./styles.css";

registerModule({
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
    children: [{ key: "tickets", label: "Tickets", href: "/pos/tickets" }],
  },
  resources: ["pos.ticket"],
  Routes: PosRoutes,
});
