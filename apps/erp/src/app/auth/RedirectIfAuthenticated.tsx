/**
 * Route guard for the sign-in screen: somebody already signed in has no
 * business being offered the form again.
 *
 * Where they go depends on where they are. On their own subdomain, into
 * the workspace. On the platform apex, a leftover *tenant* session must
 * not trap them: clearing it shows the form so platform staff can sign
 * in. A platform account stays on the apex (packages screen). Only a
 * tenant host (or a fresh apex login that just set tokens) uses the
 * handoff to the workspace subdomain.
 *
 * A session that turns out to be dead (revoked, or expired past
 * refreshing) falls through to the form rather than trapping them on a
 * spinner.
 */

import { useEffect, useState, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import { currentTenantSlug } from "@/lib/tenant";
import { forgetSession } from "@/app/session";
import { fetchMe } from "./api";
import { crossToWorkspace } from "./workspace";

export function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [showForm, setShowForm] = useState(!isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;

    const onApex = currentTenantSlug() === null;

    void (async () => {
      try {
        if (onApex) {
          const me = await fetchMe();
          if (cancelled) return;
          // Tenant JWTs left on localhost bounce every visit to the
          // subdomain and block platform@… from ever seeing /login.
          if (me.client) {
            clearTokens();
            forgetSession();
            setShowForm(true);
            return;
          }
          navigate(from.startsWith("/platform") ? from : "/platform/modules", {
            replace: true,
          });
          return;
        }

        const crossing = await crossToWorkspace();
        if (cancelled || crossing) return;
        navigate(from, { replace: true });
      } catch {
        clearTokens();
        forgetSession();
        if (!cancelled) setShowForm(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, navigate]);

  if (showForm) return children;

  return (
    <div className="grid min-h-screen place-items-center bg-erp-bg px-4 text-center">
      <p className="m-0 text-[12px] text-erp-muted">Taking you to your workspace…</p>
    </div>
  );
}
