import { FileBarChart } from "lucide-react";
import type { ErpModule } from "../types";
import { ReportsRoutes } from "./routes";

export const reportsSubmenu = [
  { key: "balance-sheet", label: "Balance Sheet", href: "/reports/balance-sheet" },
  { key: "profit-and-loss", label: "Profit and Loss", href: "/reports/profit-and-loss" },
  { key: "cash-flow", label: "Cash Flow Statement", href: "/reports/cash-flow" },
];

export const reportsManifest: ErpModule = {
  id: "reports",
  label: "Statement Reports",
  version: "0.1.0",
  description: "Balance sheet, profit and loss, and cash flow statements.",
  icon: FileBarChart,
  path: "/reports",
  nav: {
    key: "reports",
    label: "Statement Reports",
    icon: FileBarChart,
    href: "/reports/balance-sheet",
    children: reportsSubmenu.map(({ key, label, href }) => ({ key, label, href })),
  },
  submenu: reportsSubmenu,
  Routes: ReportsRoutes,
};

export default reportsManifest;
