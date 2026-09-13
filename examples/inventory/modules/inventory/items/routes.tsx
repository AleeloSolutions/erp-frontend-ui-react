import { Outlet, Route } from "react-router-dom";
import ItemsPage from "./pages/list";
import ItemCreatePage from "./pages/create";
import ItemEditPage from "./pages/edit";

/** Item screens, mounted by the module under `/inventory/*`. */
export const itemRoutes = (
  <Route path="items" element={<Outlet />}>
    <Route index element={<ItemsPage />} />
    <Route path="new" element={<ItemCreatePage />} />
    <Route path=":uuid/edit" element={<ItemEditPage />} />
  </Route>
);
