import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { currentTenantSlug } from "@/lib/tenant";
import { resolveTenant } from "@/app/auth/api";
import { WorkspaceNotFound } from "@/app/auth/WorkspaceNotFound";

type GateState = "checking" | "ready" | "not-found";

/**
 * Vercel's wildcard domain serves this same build for every *.erpeast.com
 * host, real tenant or not -- nothing at the DNS/CDN layer knows which
 * subdomains exist. So on a tenant host we ask the backend before
 * rendering anything: unknown/suspended subdomains get a "not found"
 * screen instead of the marketing site or a login form for a workspace
 * that isn't there.
 */
export function App() {
  const tenantSlug = currentTenantSlug();
  const [gate, setGate] = useState<GateState>(tenantSlug ? "checking" : "ready");

  useEffect(() => {
    if (!tenantSlug) return;
    let cancelled = false;
    resolveTenant()
      .then(() => {
        if (!cancelled) setGate("ready");
      })
      .catch(() => {
        if (!cancelled) setGate("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  if (gate === "checking") return null;
  if (gate === "not-found") return <WorkspaceNotFound />;

  return (
    <BrowserRouter>
      <AppRoutes isTenantHost={tenantSlug !== null} />
    </BrowserRouter>
  );
}
