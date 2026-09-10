import { Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import InvoicesPage from "./pages/list";
import InvoiceCreatePage from "./pages/create";
import InvoiceEditPage from "./pages/edit";
import InvoicePrintPage from "./pages/print";

/** Invoice screens, mounted by the module under `/sales/*`. */
export const invoiceRoutes = (
  <Route
    path="invoices"
    element={
      <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.invoices}>
        <Outlet />
      </RequirePermission>
    }
  >
    <Route index element={<InvoicesPage />} />
    <Route path="new" element={<InvoiceCreatePage />} />
    <Route path=":uuid/edit" element={<InvoiceEditPage />} />
    <Route path=":uuid/print" element={<InvoicePrintPage />} />
  </Route>
);
