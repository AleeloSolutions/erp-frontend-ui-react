import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, FormField, FormInput } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { onTenantHost, tenantOrigin } from "@/lib/tenant";
import { fetchMe, login, requestWorkspaceHandoff } from "./api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      forgetSession();
      setTokens(await login(email.trim(), password));
      const me = await fetchMe();
      if (me.client && !onTenantHost(me.client.slug)) {
        // JWTs are per-origin: cross to the tenant subdomain with a
        // single-use handoff token instead of a bare redirect.
        const { token } = await requestWorkspaceHandoff();
        window.location.assign(
          `${tenantOrigin(me.client.slug)}/welcome?token=${encodeURIComponent(token)}`
        );
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Wrong email or password."
          : err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-erp-bg px-4 text-erp-text">
      <Link
        className="mb-6 text-[1.9375rem] font-bold leading-none tracking-[-0.1875rem] text-erp-subtle no-underline"
        to="/"
        aria-label="ERP home"
      >
        <span className="text-nav">e</span>rp
      </Link>

      <Card className="w-full max-w-[400px]">
        <CardContent className="p-5">
          <h1 className="mb-1 text-lg font-bold">Sign in</h1>
          <p className="mb-4 text-[12px] text-erp-muted">
            Use the email address you signed up with.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <FormField label="Email" htmlFor="login-email" required>
              <FormInput
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField label="Password" htmlFor="login-password" required>
              <FormInput
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>

            {error ? (
              <p role="alert" className="m-0 text-[12px] font-semibold text-erp-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" loading={busy} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mb-0 mt-4 text-center text-[12px] text-erp-muted">
            No account yet?{" "}
            <Link to="/trial" className="font-bold text-erp-blue hover:underline">
              Start a free trial
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
