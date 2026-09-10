import { Route } from "react-router-dom";
import ItemsPage from "./pages/list";
import ItemCreatePage from "./pages/create";

export const itemRoutes = (
  <>
    <Route path="items" element={<ItemsPage />} />
    <Route path="items/new" element={<ItemCreatePage />} />
  </>
);
