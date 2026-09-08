import { Routes } from "react-router-dom";
import { customerRoutes } from "./customers/routes";
import { quotationRoutes } from "./quotations/routes";
import { invoiceRoutes } from "./invoices/routes";
import { contractRoutes } from "./contracts/routes";

/**
 * Sales module routes — mounted at `/sales/*`.
 *
 * Each entity owns its own subtree, so adding one (sales orders next) is a
 * new folder and one line here rather than an edit spread across the module.
 */
export function SalesRoutes() {
  return (
    <Routes>
      {customerRoutes}
      {quotationRoutes}
      {invoiceRoutes}
      {contractRoutes}
    </Routes>
  );
}
