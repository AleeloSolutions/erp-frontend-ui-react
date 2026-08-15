import { Route, Routes } from "react-router-dom";
import CustomersPage from "./pages/CustomersPage";
import CustomerCreatePage from "./pages/CustomerCreatePage";
import QuotationsPage from "./pages/QuotationsPage";
import QuotationCreatePage from "./pages/QuotationCreatePage";
import ContractsPage from "./pages/ContractsPage";

/** Sales module routes — mounted at `/sales/*`. */
export function SalesRoutes() {
  return (
    <Routes>
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/new" element={<CustomerCreatePage />} />
      <Route path="quotations" element={<QuotationsPage />} />
      <Route path="quotations/new" element={<QuotationCreatePage />} />
      <Route path="contracts" element={<ContractsPage />} />
    </Routes>
  );
}
