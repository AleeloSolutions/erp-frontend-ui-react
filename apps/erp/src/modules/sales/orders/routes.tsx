import { Navigate, Outlet, Route } from "react-router-dom";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { CHILD_NAV_REQUIREMENTS } from "@/app/access";
import OrdersPage from "./pages/list";
import OrderCreatePage from "./pages/create";
import OrderEditPage from "./pages/edit";
import { OrdersLegacyEditRedirect } from "./OrdersLegacyEditRedirect";

/**
 * Sales list at `/sales` (module home). Create/edit live beside it.
 * Legacy `/sales/orders/*` paths redirect here.
 */
export const orderRoutes = (
  <>
    <Route
      index
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.orders}>
          <OrdersPage />
        </RequirePermission>
      }
    />
    <Route
      path="new"
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.orders}>
          <OrderCreatePage />
        </RequirePermission>
      }
    />
    <Route
      path=":uuid/edit"
      element={
        <RequirePermission anyOf={CHILD_NAV_REQUIREMENTS.sales.orders}>
          <OrderEditPage />
        </RequirePermission>
      }
    />
    <Route path="orders" element={<Outlet />}>
      <Route index element={<Navigate to="/sales" replace />} />
      <Route path="new" element={<Navigate to="/sales/new" replace />} />
      <Route path=":uuid/edit" element={<OrdersLegacyEditRedirect />} />
    </Route>
  </>
);
