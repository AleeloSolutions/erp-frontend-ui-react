import { Route, Routes } from "react-router-dom";
import CustomersPage from "./pages/CustomersPage";
import CustomerCreatePage from "./pages/CustomerCreatePage";
import CustomerEditPage from "./pages/CustomerEditPage";
import QuotationsPage from "./pages/QuotationsPage";
import QuotationCreatePage from "./pages/QuotationCreatePage";
import QuotationEditPage from "./pages/QuotationEditPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceCreatePage from "./pages/InvoiceCreatePage";
import InvoiceEditPage from "./pages/InvoiceEditPage";
import ContractsPage from "./pages/ContractsPage";
import ContractCreatePage from "./pages/ContractCreatePage";

/** Sales module routes — mounted at `/sales/*`. */
export function SalesRoutes() {
  return (
    <Routes>
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/new" element={<CustomerCreatePage />} />
      <Route path="customers/:id/edit" element={<CustomerEditPage />} />
      <Route path="quotations" element={<QuotationsPage />} />
      <Route path="quotations/new" element={<QuotationCreatePage />} />
      <Route path="quotations/:id/edit" element={<QuotationEditPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="invoices/new" element={<InvoiceCreatePage />} />
      <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
      <Route path="contracts" element={<ContractsPage />} />
      <Route path="contracts/new" element={<ContractCreatePage />} />
    </Routes>
  );
}
