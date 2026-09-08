/**
 * Route guard for everything behind a login.
 *
 * Two questions, not one. "Is there a session?" decides between the app
 * and the login screen. "Does the session belong to *this* workspace?"
 * decides whether the app is even the right app: a token is per-origin,
 * but nothing stops somebody typing another tenant's subdomain into the
 * address bar, and rendering the shell there shows them their own name
 * over a workspace that will refuse every request behind it.
 *
 * So a session on the wrong subdomain is carried to its own, through the
 * same single-use handoff the login flow uses. The API refuses the
 * foreign tenant regardless — this exists so the answer is "here is your
 * workspace" rather than a shell full of empty panels.
 */

import { useEffect, useState, type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError } from "@/lib/api-client";
import { clearTokens, isAuthenticated } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { crossToWorkspace } from "./workspace";

/**
 * Whether this page load has already confirmed the session belongs here.
 *
 * Module-level on purpose: the check costs a `/users/me/` round trip, and
 * asking again on every navigation would put one in front of every screen.
 * Crossing to another workspace is a full page load, which resets it.
 */
let workspaceConfirmed = false;

type Gate = "checking" | "allowed" | "signed-out";

export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const [gate, setGate] = useState<Gate>(() => {
    if (!isAuthenticated()) return "signed-out";
    return workspaceConfirmed ? "allowed" : "checking";
  });

  useEffect(() => {
    if (gate !== "checking") return;
    let cancelled = false;

    void crossToWorkspace()
      .then((crossing) => {
        // Crossing: the browser is already on its way to the other origin,
        // so leave the spinner up rather than flashing a screen it is
        // about to throw away.
        if (cancelled || crossing) return;
        workspaceConfirmed = true;
        setGate("allowed");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Only a refused session means sign out. A network blip must not
        // log somebody out of a workspace they are entitled to: let them
        // through and leave the boundary where it actually is, on the API.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearTokens();
          forgetSession();
          setGate("signed-out");
          return;
        }
        setGate("allowed");
      });

    return () => {
      cancelled = true;
    };
  }, [gate]);

  if (gate === "signed-out") {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (gate === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-erp-bg px-4 text-center">
        <p className="m-0 text-[12px] text-erp-muted">Checking your workspace…</p>
      </div>
    );
  }

  return children;
}
