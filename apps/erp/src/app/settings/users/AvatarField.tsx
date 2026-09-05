/**
 * The profile picture on the user form: initials until there is one, with
 * Edit and Remove appearing over it on hover (and on keyboard focus, so
 * the controls are reachable without a mouse).
 *
 * While creating there is no user to upload to yet, so the chosen file is
 * held here and previewed; the page sends it once the account exists.
 */

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn, useToast } from "@erp/ui";
import { ApiError } from "@/lib/api-client";
import { deleteAvatar, uploadAvatar } from "../usersApi";

/** Mirrors AVATAR_EXTENSIONS / AVATAR_MAX_BYTES on the server, so an
 * impossible file is refused here rather than after a round trip. */
const ACCEPTED = ".png,.jpg,.jpeg,.webp";
const MAX_BYTES = 2 * 1024 * 1024;

export interface AvatarFieldProps {
  /** null while creating: uploads are deferred to the page's save. */
  userUuid: string | null;
  /** The stored picture, if any. */
  src: string | null;
  initials: string;
  editable: boolean;
  /** A file chosen before the account exists. */
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  /** Called after a successful upload/removal so the page can re-read. */
  onChanged: () => void;
}

export function AvatarField({
  userUuid,
  src,
  initials,
  editable,
  pendingFile,
  onPendingFileChange,
  onChanged,
}: AvatarFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Object URLs are revoked when the file changes, or the field unmounts.
  useEffect(() => {
    if (!pendingFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const shown = preview ?? src;

  function reject(message: string) {
    toast({ title: "That file cannot be used", description: message, variant: "error" });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return reject("Pictures must be 2 MB or smaller.");
    if (!ACCEPTED.split(",").some((ext) => file.name.toLowerCase().endsWith(ext))) {
      return reject("Use a PNG, JPG or WebP image.");
    }

    if (!userUuid) {
      // Nothing to attach it to yet: the page uploads it after creating.
      onPendingFileChange(file);
      return;
    }
    setBusy(true);
    try {
      await uploadAvatar(userUuid, file);
      onPendingFileChange(null);
      onChanged();
      toast({ title: "Picture updated", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not upload the picture",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (pendingFile) {
      onPendingFileChange(null);
      return;
    }
    if (!userUuid || !src) return;
    setBusy(true);
    try {
      await deleteAvatar(userUuid);
      onChanged();
      toast({ title: "Picture removed", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not remove the picture",
        description: error instanceof ApiError ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group relative h-[104px] w-[104px] shrink-0">
      <div
        className={cn(
          "grid h-full w-full place-items-center overflow-hidden rounded-[10px]",
          "bg-erp-primary text-[38px] font-semibold text-erp-primary-foreground",
          busy && "opacity-70"
        )}
      >
        {shown ? (
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </div>

      {editable ? (
        <>
          {/* Hidden input: the pencil is the visible control. */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              // Let the same file be picked again after a removal.
              event.target.value = "";
            }}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-1.5",
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            )}
          >
            <AvatarButton
              label="Edit"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </AvatarButton>
            {shown ? (
              <AvatarButton
                label="Remove"
                disabled={busy}
                onClick={() => void handleRemove()}
              >
                <Trash2 className="h-3.5 w-3.5 text-erp-error" aria-hidden />
              </AvatarButton>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AvatarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pointer-events-auto grid h-7 w-7 place-items-center rounded-full",
        "bg-erp-surface text-erp-text shadow-sm transition-colors",
        "hover:bg-erp-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erp-focus",
        "disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      {children}
    </button>
  );
}
