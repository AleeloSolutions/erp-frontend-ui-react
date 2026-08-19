import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import { InventoryRoutes } from "./modules/inventory/routes";
import { SalesRoutes } from "./modules/sales/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inventory/products" replace />} />
      <Route path="/dashboard" element={<HomePage />} />
      <Route path="/inventory/*" element={<InventoryRoutes />} />
      <Route path="/sales/*" element={<SalesRoutes />} />
      <Route path="*" element={<Navigate to="/inventory/products" replace />} />
    </Routes>
  );
}
