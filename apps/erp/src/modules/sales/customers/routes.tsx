import { Route } from "react-router-dom";
import CustomersPage from "./pages/list";
import CustomerCreatePage from "./pages/create";
import CustomerEditPage from "./pages/edit";

/** Customer screens, mounted by the module under `/sales/*`. */
export const customerRoutes = (
  <Route path="customers">
    <Route index element={<CustomersPage />} />
    <Route path="new" element={<CustomerCreatePage />} />
    <Route path=":uuid/edit" element={<CustomerEditPage />} />
  </Route>
);
