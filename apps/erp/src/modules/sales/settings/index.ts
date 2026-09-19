/**
 * Settings -> Sales: the module's own area, declared by the module.
 *
 * These three tabs used to live in the application shell, which meant
 * the shell imported the sales API and a build without the module did
 * not compile. They travel with the module now, so its package carries
 * them and the shell knows only that *some* module contributed an area.
 *
 * The panels are `lazy` for the same reason the module's routes are: the
 * manifest is read at startup to build the navbar, and pulling a 900-line
 * panel into that path would put every sales form in the entry chunk.
 * All three share one chunk, because opening one of these tabs almost
 * always means opening its neighbours.
 *
 * A tab's key is also the `#hash` that deep-links to it, which is what
 * keeps the Sales navbar's "Settings" item (`/settings#sales`) working.
 */

import { lazy } from "react";
import { SETTINGS_CODES } from "@/app/access";
import type { ModuleSettings } from "@/modules/types";

type PanelName = "SalesDefaultsPanel" | "SalesTaxesPanel" | "SalesPaymentMethodsPanel";

const panel = (name: PanelName) =>
  lazy(() =>
    import("./SalesSettingsPanel").then((module) => ({ default: module[name] }))
  );

// The sales settings API checks the tenant-settings code; there is no
// settings.sales.edit to hold.
const REQUIRES = [...SETTINGS_CODES.sales];

export const salesSettings: ModuleSettings = {
  label: "Sales",
  tabs: [
    {
      key: "sales",
      label: "Sale Defaults",
      requires: REQUIRES,
      Panel: panel("SalesDefaultsPanel"),
    },
    {
      key: "sales-taxes",
      label: "Taxes",
      requires: REQUIRES,
      Panel: panel("SalesTaxesPanel"),
    },
    {
      key: "sales-payments",
      label: "Payment Methods",
      requires: REQUIRES,
      Panel: panel("SalesPaymentMethodsPanel"),
    },
  ],
};
