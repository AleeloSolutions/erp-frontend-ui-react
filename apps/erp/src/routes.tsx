import { Suspense, useEffect, useState } from "react";
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
import { RequirePlatform } from "@/app/auth/RequirePlatform";
import ModulePackagesPage from "@/app/platform/ModulePackagesPage";
import { RequirePermission } from "@/app/auth/RequirePermission";
import { RedirectIfAuthenticated } from "@/app/auth/RedirectIfAuthenticated";
import { NAV_REQUIREMENTS, SETTINGS_CODES, navRequirementFor } from "@/app/access";
import { useSession } from "@/app/session";
import { isAuthenticated } from "@/lib/auth";
import { type ModuleManifest } from "./modules";
import { pendingBundles } from "./modules/loader";
import { ModuleBundleLoader } from "./modules/ModuleBundleLoader";
import { useModules } from "./modules/registry";

/** How long an unknown URL waits for the session and its bundles. */
export const NOT_FOUND_PATIENCE_MS = 15_000;

/**
 * The not-found treatment -- unless the URL may belong to a packaged
 * module that has not registered yet. A hard load of /pos/tickets reaches
 * here twice before the POS bundle has run: once before the session has
 * even arrived, once while the bundle is on its way. Sending it home would
 * lose the deep link, so a signed-in visitor waits, and the route table
 * picks the URL up the moment the module registers. A bundle that fails
 * is given up on (pendingBundles), and the wait is capped, so nothing can
 * hold a URL hostage.
 */
function NotFound() {
  const session = useSession();
  const modules = useModules();
  const [patient, setPatient] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setPatient(false), NOT_FOUND_PATIENCE_MS);
    return () => clearTimeout(timer);
  }, []);
  const sessionPending = isAuthenticated() && session === null;
  const bundlesPending =
    session !== null && pendingBundles(session.module_bundles, modules).length > 0;
  const waiting = patient && (sessionPending || bundlesPending);
  if (!waiting) return <Navigate to="/" replace />;
  return (
    <div className="grid min-h-screen place-items-center bg-erp-bg px-4 text-center">
      <p className="m-0 text-[12px] text-erp-muted">Loading modules…</p>
    </div>
  );
}

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
  // The live registry: compiled-in modules plus packaged ones as they register.
  const modules = useModules();
  return (
    <>
      <ModuleBundleLoader />
      <Routes>
        {isTenantHost ? (
          // Tenant subdomains are the workspace, never the marketing site:
          // "/" resolves straight to the dashboard or the login form.
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />
            }
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
        {/* Platform staff: module packages (the senior's screen). */}
        <Route
          path="/platform/modules"
          element={
            <RequireAuth>
              <RequirePlatform>
                <ModulePackagesPage />
              </RequirePlatform>
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
        {modules.map((module) => (
          <Route
            key={module.key}
            path={`${module.path}/*`}
            element={
              <RequireAuth>
                <RequireModule module={module.key}>
                  <RequirePermission anyOf={navRequirementFor(module)}>
                    <ModuleScreen module={module} />
                  </RequirePermission>
                </RequireModule>
              </RequireAuth>
            }
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
