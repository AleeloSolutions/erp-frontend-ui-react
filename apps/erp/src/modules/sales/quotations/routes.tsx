import { Route } from "react-router-dom";
import QuotationsPage from "./pages/list";
import QuotationCreatePage from "./pages/create";
import QuotationEditPage from "./pages/edit";

/** Quotation screens, mounted by the module under `/sales/*`. */
export const quotationRoutes = (
  <Route path="quotations">
    <Route index element={<QuotationsPage />} />
    <Route path="new" element={<QuotationCreatePage />} />
    <Route path=":uuid/edit" element={<QuotationEditPage />} />
  </Route>
);
