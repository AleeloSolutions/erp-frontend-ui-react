import { Wallet } from "lucide-react";
import type { ErpModule } from "../types";
import { AccountingRoutes } from "./routes";

export const accountingManifest: ErpModule = {
  id: "accounting",
  label: "Accounting",
  version: "0.1.0",
  description: "Invoices, payments, and chart of accounts (coming soon).",
  icon: Wallet,
  path: "/accounting",
  nav: {
    key: "accounting",
    label: "Accounting",
    icon: Wallet,
    href: "/accounting",
  },
  Routes: AccountingRoutes,
};

export default accountingManifest;
