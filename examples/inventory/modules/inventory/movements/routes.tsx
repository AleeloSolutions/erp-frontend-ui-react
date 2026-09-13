import { Outlet, Route } from "react-router-dom";
import MovementsPage from "./pages/list";
import MovementCreatePage from "./pages/create";

/** Movement screens, mounted by the module under `/inventory/*`. */
export const movementRoutes = (
  <Route path="movements" element={<Outlet />}>
    <Route index element={<MovementsPage />} />
    <Route path="new" element={<MovementCreatePage />} />
  </Route>
);
