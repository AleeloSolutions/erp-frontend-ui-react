import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import { forgetSession } from "@/app/session";
import { AUTH_SUBMIT_CLASS, AuthCard, AuthField } from "./AuthCard";
import { verifyEmail } from "./api";

/**
 * Target of the verification email: one submit verifies the address AND
 * sets the password, then signs the user straight in.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkDead, setLinkDead] = useState(!token);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      forgetSession();
      setTokens(await verifyEmail(token, password));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_token") {
        setLinkDead(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
      setBusy(false);
    }
  }

  if (linkDead) {
    return (
      <AuthCard
        title="This link is invalid or has expired"
        subtitle="Request a fresh one from the “Pending verification” banner on your dashboard, or sign in if you already set a password."
      >
        <Link
          to="/login"
          className="font-medium text-[var(--brand-primary)] hover:underline"
        >
          Go to sign in →
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      // The link carries a token, not an address, and inventing one would
      // mean a call this page does not make.
      subtitle="Choose a secure password to complete your account setup."
      footer={<>Need help? Contact your workspace admin.</>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="verify-password"
          label="New password"
          type="password"
          revealable
          required
          autoComplete="new-password"
          autoFocus
          minLength={8}
          placeholder="Enter new password"
          helper="Must be at least 8 characters with a mix of letters and numbers."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <AuthField
          id="verify-confirm"
          label="Confirm password"
          type="password"
          revealable
          required
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
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
            Verify &amp; set password
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
