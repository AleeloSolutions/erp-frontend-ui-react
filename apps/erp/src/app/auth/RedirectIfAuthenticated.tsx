/**
 * Route guard for the sign-in screen: somebody already signed in has no
 * business being offered the form again.
 *
 * Where they go depends on where they are. On their own subdomain, into
 * the workspace. On the platform domain, across to it with the same
 * single-use handoff the login flow uses -- their tokens do not travel
 * between origins by themselves.
 *
 * A session that turns out to be dead (revoked, or expired past
 * refreshing) falls through to the form rather than trapping them on a
 * spinner.
 */

import { useEffect, useState, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { crossToWorkspace } from "./workspace";

export function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [showForm, setShowForm] = useState(!isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;

    void crossToWorkspace()
      .then((crossing) => {
        if (cancelled || crossing) return; // the page is already leaving
        navigate(from, { replace: true });
      })
      .catch(() => {
        // The stored session is no longer good for anything.
        clearTokens();
        forgetSession();
        if (!cancelled) setShowForm(true);
      });

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
