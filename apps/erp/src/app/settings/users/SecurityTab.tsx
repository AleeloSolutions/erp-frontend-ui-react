/**
 * The user form's Security tab: the three ways to hand someone back into
 * their account. Each one calls the API and is refused there too — the
 * owner's password is off limits to anyone but the owner, and nobody
 * sets their own password here.
 */

import { useState } from "react";
import { Button, FormField, FormInput, Modal, useToast } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import {
  createPasswordResetLink,
  sendPasswordReset,
  setUserPassword,
  type CurrentUser,
  type TenantUser,
} from "../usersApi";

export interface SecurityTabProps {
  user: TenantUser;
  me: CurrentUser | null;
  canManage: boolean;
}

export function SecurityTab({ user, me, canManage }: SecurityTabProps) {
  const { toast } = useToast();
  const [changing, setChanging] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState<"save" | "send" | "link" | null>(null);
  // Clipboard access can be denied (or missing outside HTTPS); then the link
  // is shown instead of silently going nowhere.
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const isSelf = me?.uuid === user.uuid;
  const ownerIsOffLimits =
    user.user_type === "owner" &&
    me?.user_type !== "owner" &&
    me?.user_type !== "platform";
  const allowed = canManage && !ownerIsOffLimits;

  function report(error: unknown, title: string) {
    toast({
      title,
      description: error instanceof ApiError ? error.message : "Please try again.",
      variant: "error",
    });
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setFieldError("The two passwords do not match.");
      return;
    }
    setBusy("save");
    setFieldError(undefined);
    try {
      await setUserPassword(user.uuid, password);
      toast({
        title: "Password changed",
        description: `${user.full_name || user.email} can sign in with it now.`,
        variant: "success",
      });
      setChanging(false);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      if (error instanceof ApiError && error.fields?.password) {
        setFieldError(error.fields.password[0]);
      } else {
        report(error, "Could not change the password");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    setBusy("send");
    try {
      await sendPasswordReset(user.uuid);
      toast({
        title: "Reset link sent",
        description: `We emailed ${user.email}.`,
        variant: "success",
      });
    } catch (error) {
      report(error, "Could not send the reset link");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    setBusy("link");
    try {
      const { link } = await createPasswordResetLink(user.uuid);
      try {
        await navigator.clipboard.writeText(link);
        toast({
          title: "Reset link copied",
          description: "It works once, and expires in 72 hours.",
          variant: "success",
        });
      } catch {
        setFallbackLink(link);
      }
    } catch (error) {
      report(error, "Could not create the reset link");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div role="tabpanel" aria-label="Security" className="pt-5">
      <div className="flex flex-col gap-3 border-b border-erp-border-soft pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="m-0 text-[13px] font-bold text-erp-text">Change Password</h3>
          <p className="m-0 text-[12px] text-erp-muted">Update if compromised.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Setting your own password here is refused by the API: use the
              reset link, which proves you still hold the inbox. */}
          {!isSelf ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={!allowed}
              onClick={() => setChanging(true)}
            >
              Change password
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            disabled={!allowed}
            loading={busy === "send"}
            onClick={() => void handleSend()}
          >
            Send Password Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!allowed}
            loading={busy === "link"}
            onClick={() => void handleCopy()}
          >
            Copy Reset Password Link
          </Button>
        </div>
      </div>

      {ownerIsOffLimits ? (
        <p className="m-0 pt-3 text-[11px] text-erp-muted">
          Only the workspace owner can reset the owner&apos;s password.
        </p>
      ) : null}

      <Modal
        open={changing}
        onClose={() => setChanging(false)}
        title="Change password"
        description={`Set a new password for ${user.full_name || user.email}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setChanging(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="change-password"
              variant="primary"
              loading={busy === "save"}
            >
              Change password
            </Button>
          </>
        }
      >
        <form
          id="change-password"
          className="grid gap-3"
          onSubmit={(event) => void submitPassword(event)}
        >
          <FormField
            label="New password"
            htmlFor="new-password"
            required
            error={fieldError}
          >
            <FormInput
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirm-password" required>
            <FormInput
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </FormField>
          <p className="m-0 text-[11px] text-erp-muted">
            They are not told the new password — pass it on yourself, or send a reset link
            instead.
          </p>
        </form>
      </Modal>

      <Modal
        open={fallbackLink !== null}
        onClose={() => setFallbackLink(null)}
        title="Reset password link"
        description="Copying was blocked by the browser, so here is the link."
        footer={
          <Button variant="secondary" onClick={() => setFallbackLink(null)}>
            Close
          </Button>
        }
      >
        <FormInput
          readOnly
          value={fallbackLink ?? ""}
          onFocus={(e) => e.target.select()}
        />
        <p className="m-0 pt-2 text-[11px] text-erp-muted">
          It works once, and expires in 72 hours.
        </p>
      </Modal>
    </div>
  );
}
