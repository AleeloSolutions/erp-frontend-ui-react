import { Navigate, Route, Routes } from "react-router-dom";
import { itemRoutes } from "./items";

export function InventoryRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="items" replace />} />
      {itemRoutes}
    </Routes>
  );
}
