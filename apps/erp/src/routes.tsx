import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/app/HomePage";
import LandingPage from "@/app/landing/LandingPage";
import TrialPage from "@/app/trial/TrialPage";
import TrialThanksPage from "@/app/trial/TrialThanksPage";
import SettingsPage from "@/app/settings/SettingsPage";
import UserFormPage from "@/app/settings/users/UserFormPage";
import RoleFormPage from "@/app/settings/roles/RoleFormPage";
import BranchFormPage from "@/app/settings/branches/BranchFormPage";
import LoginPage from "@/app/auth/LoginPage";
import WelcomePage from "@/app/auth/WelcomePage";
import VerifyEmailPage from "@/app/auth/VerifyEmailPage";
import { RequireAuth } from "@/app/auth/RequireAuth";
import { RequireModule } from "@/app/auth/RequireModule";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { RedirectIfAuthenticated } from "@/app/auth/RedirectIfAuthenticated";
import { NAV_REQUIREMENTS, SETTINGS_CODES } from "@/app/access";
import { isAuthenticated } from "@/lib/auth";
import { moduleRegistry, type ModuleManifest } from "./modules";

/** A module's route tree, loaded on first visit -- its chunk is separate. */
function ModuleScreen({ module }: { module: ModuleManifest }) {
  const ModuleRoutes = module.Routes;
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-erp-bg px-4 text-center">
          <p className="m-0 text-[12px] text-erp-muted">Loading {module.label}…</p>
        </div>
      }
    >
      <ModuleRoutes />
    </Suspense>
  );
}

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
        path="/settings/branches/new"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.branch.create"]}>
              <BranchFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/branches/:uuid"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.branch.edit"]}>
              <BranchFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/users/new"
        element={
          <RequireAuth>
            <RequirePermission anyOf={[...SETTINGS_CODES.users]}>
              <UserFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/users/:uuid"
        element={
          <RequireAuth>
            <RequirePermission anyOf={[...SETTINGS_CODES.users]}>
              <UserFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/roles/new"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.role.create"]}>
              <RoleFormPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/roles/:uuid"
        element={
          <RequireAuth>
            <RequirePermission anyOf={["settings.role.edit"]}>
              <RoleFormPage />
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
      {/*
        Business modules come from the registry. Each mounts at its own
        prefix behind three guards: a session, the module being installed
        for this tenant (me.enabled_modules -- a module the tenant lacks
        answers like a URL that never existed), and a code that gives the
        account something to see there.
      */}
      {moduleRegistry.map((module) => (
        <Route
          key={module.key}
          path={`${module.path}/*`}
          element={
            <RequireAuth>
              <RequireModule module={module.key}>
                <RequirePermission anyOf={NAV_REQUIREMENTS[module.nav.key] ?? []}>
                  <ModuleScreen module={module} />
                </RequirePermission>
              </RequireModule>
            </RequireAuth>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
