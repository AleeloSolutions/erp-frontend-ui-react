import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "@/app/session";
import { customerRoutes } from "./customers/routes";
import { quotationRoutes } from "./quotations/routes";
import { invoiceRoutes } from "./invoices/routes";
import { contractRoutes } from "./contracts/routes";
import { firstSalesHref } from "./useSalesNavbar";

function SalesIndexRedirect() {
  const session = useSession();
  return <Navigate to={firstSalesHref(session?.permissions ?? null)} replace />;
}

/**
 * Sales module routes — mounted at `/sales/*`.
 *
 * Each entity owns its own subtree, so adding one (sales orders next) is a
 * new folder and one line here rather than an edit spread across the module.
 */
export function SalesRoutes() {
  return (
    <Routes>
      <Route index element={<SalesIndexRedirect />} />
      {customerRoutes}
      {quotationRoutes}
      {invoiceRoutes}
      {contractRoutes}
    </Routes>
  );
}
