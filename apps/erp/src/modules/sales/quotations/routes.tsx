import { Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import QuotationsPage from "./pages/list";
import QuotationCreatePage from "./pages/create";
import QuotationEditPage from "./pages/edit";

/** Quotation screens, mounted by the module under `/sales/*`. */
export const quotationRoutes = (
  <Route
    path="quotations"
    element={
      <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.quotations}>
        <Outlet />
      </RequirePermission>
    }
  >
    <Route index element={<QuotationsPage />} />
    <Route path="new" element={<QuotationCreatePage />} />
    <Route path=":uuid/edit" element={<QuotationEditPage />} />
  </Route>
);
