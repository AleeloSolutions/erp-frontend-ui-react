import { Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import CustomersPage from "./pages/list";
import CustomerCreatePage from "./pages/create";
import CustomerEditPage from "./pages/edit";

/** Customer screens, mounted by the module under `/sales/*`. */
export const customerRoutes = (
  <Route
    path="customers"
    element={
      <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.customers}>
        <Outlet />
      </RequirePermission>
    }
  >
    <Route index element={<CustomersPage />} />
    <Route path="new" element={<CustomerCreatePage />} />
    <Route path=":uuid/edit" element={<CustomerEditPage />} />
  </Route>
);
