import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import LandingPage from "@/app/landing/LandingPage";
import TrialPage from "@/app/trial/TrialPage";
import TrialThanksPage from "@/app/trial/TrialThanksPage";
import SettingsPage from "@/app/settings/SettingsPage";
import { SalesRoutes } from "./modules/sales/routes";
import { InventoryRoutes } from "./modules/inventory/routes";
import { ReportsRoutes } from "./modules/reports/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/trial" element={<TrialPage />} />
      <Route path="/thanks/trial" element={<TrialThanksPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/dashboard" element={<HomePage />} />
      <Route path="/sales/*" element={<SalesRoutes />} />
      <Route path="/inventory/*" element={<InventoryRoutes />} />
      <Route path="/reports/*" element={<ReportsRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
