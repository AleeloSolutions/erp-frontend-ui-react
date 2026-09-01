import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import LandingPage from "@/app/landing/LandingPage";
import TrialPage from "@/app/trial/TrialPage";
import TrialThanksPage from "@/app/trial/TrialThanksPage";
import SettingsPage from "@/app/settings/SettingsPage";
import LoginPage from "@/app/auth/LoginPage";
import WelcomePage from "@/app/auth/WelcomePage";
import VerifyEmailPage from "@/app/auth/VerifyEmailPage";
import { RequireAuth } from "@/app/auth/RequireAuth";
import { SalesRoutes } from "./modules/sales/routes";
import { InventoryRoutes } from "./modules/inventory/routes";
import { ReportsRoutes } from "./modules/reports/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/trial" element={<TrialPage />} />
      <Route path="/thanks/trial" element={<TrialThanksPage />} />
      {/* Auth flow (public) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {/* Workspace (requires a session) */}
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/sales/*"
        element={
          <RequireAuth>
            <SalesRoutes />
          </RequireAuth>
        }
      />
      <Route
        path="/inventory/*"
        element={
          <RequireAuth>
            <InventoryRoutes />
          </RequireAuth>
        }
      />
      <Route
        path="/reports/*"
        element={
          <RequireAuth>
            <ReportsRoutes />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
