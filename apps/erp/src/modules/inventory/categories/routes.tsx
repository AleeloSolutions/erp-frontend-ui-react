import { Outlet, Route } from "react-router-dom";
import CategoriesPage from "./pages/list";
import CategoryCreatePage from "./pages/create";
import CategoryEditPage from "./pages/edit";

/** Category screens, mounted by the module under `/inventory/*`. */
export const categoryRoutes = (
  <Route path="categories" element={<Outlet />}>
    <Route index element={<CategoriesPage />} />
    <Route path="new" element={<CategoryCreatePage />} />
    <Route path=":uuid/edit" element={<CategoryEditPage />} />
  </Route>
);
