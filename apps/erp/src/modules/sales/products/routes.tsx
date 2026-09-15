import { Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import ProductsPage from "./pages/list";
import ProductEditPage from "./pages/edit";

/** Product screens, mounted by the module under `/sales/*`. */
export const productRoutes = (
  <Route
    path="products"
    element={
      <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.products}>
        <Outlet />
      </RequirePermission>
    }
  >
    <Route index element={<ProductsPage />} />
    <Route path=":uuid/edit" element={<ProductEditPage />} />
  </Route>
);
