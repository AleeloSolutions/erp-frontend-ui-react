import type { ReactNode } from "react";
import { Modal, type ModalProps } from "../Modal";
import { Button } from "../../primitives/Button";
import { useUiTranslation } from "../../i18n";

export interface RecordFormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  /** Disables dismissal and spins the Save button. */
  saving?: boolean;
  /** Save failure, shown as a banner above the form body. */
  error?: string | null;
  saveLabel?: string;
  cancelLabel?: string;
  size?: ModalProps["size"];
  children: ReactNode;
}

/**
 * Modal chrome for a record form: title, Save / Cancel, saving state, error
 * banner, and a slot for the body. It owns no form state — pair it with
 * `RecordFormFields` (or any body) and keep the values in the app.
 */
export function RecordFormModal({
  open,
  title,
  onClose,
  onSave,
  saving = false,
  error = null,
  saveLabel,
  cancelLabel,
  // `xl` is the only size that caps its height, and a record form is exactly
  // the content that outgrows the viewport: at `lg` a fifteen-field form
  // pushed its own title and Save button off-screen. The extra width also
  // stops span-3 fields collapsing into columns too narrow for their own
  // helper text.
  size = "xl",
  children,
}: RecordFormModalProps) {
  const { t } = useUiTranslation("ui");

  // A save in flight must not be dismissed out from under itself.
  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size={size}
      bodyClassName="p-0"
      // Save first, then Discard -- the order the record pages already use,
      // so the dialog and the full page do not disagree about which button
      // sits where.
      footer={
        <>
          <Button variant="primary" loading={saving} onClick={onSave}>
            {saveLabel ?? t("recordForm.save")}
          </Button>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            {cancelLabel ?? t("recordForm.discard")}
          </Button>
        </>
      }
    >
      {error ? (
        <div
          role="alert"
          className="shrink-0 border-b border-erp-error-border bg-erp-error-bg px-3 py-2 text-[11px] text-erp-error"
        >
          {error}
        </div>
      ) : null}
      {/* The fields scroll, not the dialog: the title stays put, the error
          banner stays visible, and Save never leaves the screen. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </Modal>
  );
}
