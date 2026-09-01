import { useState } from "react";
import { Button, useToast } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { resendVerification } from "./api";
import { useMe } from "./useMe";

/** "Pending verification" alert: the workspace stays usable during the
 * grace period, but keeps nudging until the email is verified. */
export function VerificationBanner() {
  const { data: me } = useMe();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  if (!me || me.email_verified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await resendVerification();
      toast({
        title: "Verification email sent",
        description: `Check ${me?.email} for the link.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not send the email",
        description:
          err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      className="mb-3 flex flex-col gap-2 rounded-[7px] border border-erp-warning-border bg-erp-warning-bg px-3 py-2 text-[12px] text-erp-warning sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="m-0">
        <strong>Pending verification.</strong> We emailed {me.email} — open the link to
        verify your address and set your password.
      </p>
      <Button
        size="sm"
        variant="secondary"
        loading={sending}
        onClick={handleResend}
        className="shrink-0"
      >
        Resend email
      </Button>
    </div>
  );
}
