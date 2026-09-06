import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { AUTH_SUBMIT_CLASS, AuthCard, AuthField } from "./AuthCard";
import { login } from "./api";
import { crossToWorkspace } from "./workspace";

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
      // JWTs are per-origin, so a session started here crosses to the
      // tenant subdomain with a single-use handoff token.
      if (await crossToWorkspace()) return;
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
    <AuthCard
      title="Sign in"
      subtitle="Use the email address you signed up with."
      footer={
        <>
          No account yet?{" "}
          <Link
            to="/trial"
            className="font-medium text-erp-text underline decoration-erp-border underline-offset-2 transition-colors hover:decoration-erp-subtle"
          >
            Start a free trial
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          id="login-password"
          label="Password"
          type="password"
          revealable
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? (
          <p role="alert" className="m-0 text-[12px] font-semibold text-erp-danger">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={busy}
            className={AUTH_SUBMIT_CLASS}
          >
            Sign in
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
