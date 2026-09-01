import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardContent, FormField, FormInput } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-erp-bg px-4 text-erp-text">
      <Card className="w-full max-w-[400px]">
        <CardContent className="p-5">
          {linkDead ? (
            <>
              <h1 className="mb-1 text-lg font-bold">
                This link is invalid or has expired
              </h1>
              <p className="mb-4 text-[12px] text-erp-muted">
                Request a fresh one from the “Pending verification” banner on your
                dashboard, or sign in if you already set a password.
              </p>
              <Link to="/login" className="font-bold text-erp-blue hover:underline">
                Go to sign in →
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-bold">Verify your email</h1>
              <p className="mb-4 text-[12px] text-erp-muted">
                Choose a password to finish securing your workspace.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <FormField label="New password" htmlFor="verify-password" required>
                  <FormInput
                    id="verify-password"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </FormField>
                <FormField label="Confirm password" htmlFor="verify-confirm" required>
                  <FormInput
                    id="verify-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </FormField>

                {error ? (
                  <p
                    role="alert"
                    className="m-0 text-[12px] font-semibold text-erp-danger"
                  >
                    {error}
                  </p>
                ) : null}

                <Button type="submit" variant="primary" loading={busy} className="w-full">
                  Verify & set password
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
