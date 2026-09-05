import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { exchangeAutoLoginToken } from "./api";

/**
 * Landing point on the tenant subdomain right after signup (or a
 * base-domain login): redeems the single-use `?token=` for a JWT pair
 * and drops the user in the dashboard. A used/expired token falls back
 * to the login form.
 */
export default function WelcomePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [failed, setFailed] = useState(false);
  // StrictMode runs effects twice in dev; the token is single-use.
  const ran = useRef(false);

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
      ) : (
        <>
          <h1 className="m-0 text-lg font-bold">Preparing your workspace…</h1>
          <p className="m-0 text-[13px] text-erp-muted">Signing you in securely.</p>
        </>
      )}
    </div>
  );
}
