import { Route, Routes } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import ProductCreatePage from "./pages/ProductCreatePage";
import ProductEditPage from "./pages/ProductEditPage";
import StockMovementsPage from "./pages/StockMovementsPage";

/** Inventory module routes — mounted at `/inventory/*`. */
export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/new" element={<ProductCreatePage />} />
      <Route path="products/:id/edit" element={<ProductEditPage />} />
      <Route path="movements" element={<StockMovementsPage />} />
    </Routes>
  );
}
