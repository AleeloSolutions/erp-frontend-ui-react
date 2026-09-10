import { Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import ContractsPage from "./pages/list";
import ContractCreatePage from "./pages/create";
import ContractEditPage from "./pages/edit";

/** Contract screens, mounted by the module under `/sales/*`. */
export const contractRoutes = (
  <Route
    path="contracts"
    element={
      <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.contracts}>
        <Outlet />
      </RequirePermission>
    }
  >
    <Route index element={<ContractsPage />} />
    <Route path="new" element={<ContractCreatePage />} />
    <Route path=":uuid/edit" element={<ContractEditPage />} />
  </Route>
);
