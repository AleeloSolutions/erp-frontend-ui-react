import { Navigate, Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import SalesPage from "./pages/list";
import SaleCreatePage from "./pages/create";
import SaleEditPage from "./pages/edit";
import { SalesLegacyEditRedirect } from "./SalesLegacyEditRedirect";

/**
 * Sales list at `/sales` (module home). Create/edit live beside it.
 * Legacy `/sales/orders/*` paths redirect here.
 */
export const saleRoutes = (
  <>
    <Route
      index
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.sales}>
          <SalesPage />
        </RequirePermission>
      }
    />
    <Route
      path="new"
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.sales}>
          <SaleCreatePage />
        </RequirePermission>
      }
    />
    <Route
      path=":uuid/edit"
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.sales}>
          <SaleEditPage />
        </RequirePermission>
      }
    />
    <Route path="orders" element={<Outlet />}>
      <Route index element={<Navigate to="/sales" replace />} />
      <Route path="new" element={<Navigate to="/sales/new" replace />} />
      <Route path=":uuid/edit" element={<SalesLegacyEditRedirect />} />
    </Route>
  </>
);
