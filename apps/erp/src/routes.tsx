import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import { SalesRoutes } from "./modules/sales/routes";
import { ReportsRoutes } from "./modules/reports/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sales/customers" replace />} />
      <Route path="/dashboard" element={<HomePage />} />
      <Route path="/sales/*" element={<SalesRoutes />} />
      <Route path="/reports/*" element={<ReportsRoutes />} />
      <Route path="*" element={<Navigate to="/sales/customers" replace />} />
    </Routes>
  );
}
