import { ArrowLeftRight } from "lucide-react";
import type { ErpModule } from "../types";
import { ProcurementRoutes } from "./routes";

export const procurementManifest: ErpModule = {
  id: "procurement",
  label: "Procurement",
  version: "0.1.0",
  description: "Suppliers and purchase orders (coming soon).",
  icon: ArrowLeftRight,
  path: "/procurement",
  nav: {
    key: "procurement",
    label: "Procurement",
    icon: ArrowLeftRight,
    href: "/procurement",
  },
  Routes: ProcurementRoutes,
};

export default procurementManifest;
