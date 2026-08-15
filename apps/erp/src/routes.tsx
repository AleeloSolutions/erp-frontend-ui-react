import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import ComponentsDemoPage from "@/app/components-demo/ComponentsDemoPage";
import CustomersPage from "@/modules/sales/pages/CustomersPage";
import CustomerCreatePage from "@/modules/sales/pages/CustomerCreatePage";
import QuotationsPage from "@/modules/sales/pages/QuotationsPage";
import QuotationCreatePage from "@/modules/sales/pages/QuotationCreatePage";
import ContractsPage from "@/modules/sales/pages/ContractsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/components-demo" element={<ComponentsDemoPage />} />
      <Route path="/sales/customers" element={<CustomersPage />} />
      <Route path="/sales/customers/new" element={<CustomerCreatePage />} />
      <Route path="/sales/quotations" element={<QuotationsPage />} />
      <Route path="/sales/quotations/new" element={<QuotationCreatePage />} />
      <Route path="/sales/contracts" element={<ContractsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
