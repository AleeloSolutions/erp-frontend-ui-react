/**
 * Landing point on the tenant subdomain after a single-use `?token=` is
 * issued: redeems it for a JWT pair and opens the dashboard.
 *
 * Used for two cases with different chrome:
 * - New company signup (`?setup=1`): "Preparing your workspace…"
 * - Ordinary login / workspace handoff: silent exchange (no ceremony)
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { exchangeAutoLoginToken } from "./api";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [failed, setFailed] = useState(false);
  // StrictMode runs effects twice in dev; the token is single-use.
  const ran = useRef(false);
  const isNewCompanySetup = params.get("setup") === "1";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    exchangeAutoLoginToken(token)
      .then((pair) => {
        forgetSession();
        setTokens(pair);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => setFailed(true));
  }, [navigate, params]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-erp-bg px-4 text-center text-erp-text">
      {failed ? (
        <>
          <h1 className="m-0 text-lg font-bold">This link has expired</h1>
          <p className="m-0 max-w-[380px] text-[13px] text-erp-muted">
            Sign-in links can only be used once. Sign in with your email and password
            instead.
          </p>
          <Link
            to="/login"
            className="mt-2 inline-flex h-9 items-center rounded-[7px] border border-nav bg-nav px-4 text-[13px] font-bold text-white hover:bg-nav-active"
          >
            Go to sign in
          </Link>
        </>
      ) : isNewCompanySetup ? (
        <>
          <h1 className="m-0 text-lg font-bold">Preparing your workspace…</h1>
          <p className="m-0 text-[13px] text-erp-muted">Signing you in securely.</p>
        </>
      ) : null}
    </div>
  );
}
