import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import LandingPage from "@/app/landing/LandingPage";
import TrialPage from "@/app/trial/TrialPage";
import TrialThanksPage from "@/app/trial/TrialThanksPage";
import SettingsPage from "@/app/settings/SettingsPage";
import UserFormPage from "@/app/settings/users/UserFormPage";
import LoginPage from "@/app/auth/LoginPage";
import WelcomePage from "@/app/auth/WelcomePage";
import VerifyEmailPage from "@/app/auth/VerifyEmailPage";
import { RequireAuth } from "@/app/auth/RequireAuth";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { RedirectIfAuthenticated } from "@/app/auth/RedirectIfAuthenticated";
import { NAV_REQUIREMENTS } from "@/app/access";
import { isAuthenticated } from "@/lib/auth";
import { SalesRoutes } from "./modules/sales/routes";
import { InventoryRoutes } from "./modules/inventory/routes";
import { ReportsRoutes } from "./modules/reports/routes";

export function AppRoutes({ isTenantHost }: { isTenantHost: boolean }) {
  return (
    <Routes>
      {isTenantHost ? (
        // Tenant subdomains are the workspace, never the marketing site:
        // "/" resolves straight to the dashboard or the login form.
        <Route
          path="/"
          element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
        />
      ) : (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/trial" element={<TrialPage />} />
          <Route path="/thanks/trial" element={<TrialThanksPage />} />
        </>
      )}
      {/* Auth flow (public) */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {/* Workspace (requires a session) */}
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <RequirePermission anyOf={NAV_REQUIREMENTS.settings}>
              <SettingsPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/users/new"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.user.manage"]}>
              <UserFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/users/:uuid"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.user.manage"]}>
              <UserFormPage />
            </RequirePermission>
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
            <RequirePermission anyOf={NAV_REQUIREMENTS.sales}>
              <SalesRoutes />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/inventory/*"
        element={
          <RequireAuth>
            <RequirePermission anyOf={NAV_REQUIREMENTS.inventory}>
              <InventoryRoutes />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/reports/*"
        element={
          <RequireAuth>
            <RequirePermission anyOf={NAV_REQUIREMENTS.reports}>
              <ReportsRoutes />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
