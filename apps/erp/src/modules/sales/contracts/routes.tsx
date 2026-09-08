import { Route } from "react-router-dom";
import ContractsPage from "./pages/list";
import ContractCreatePage from "./pages/create";

/** Contract screens, mounted by the module under `/sales/*`. */
export const contractRoutes = (
  <Route path="contracts">
    <Route index element={<ContractsPage />} />
    <Route path="new" element={<ContractCreatePage />} />
  </Route>
);
