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
  size = "lg",
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
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            {cancelLabel ?? t("confirm.cancel")}
          </Button>
          <Button variant="primary" loading={saving} onClick={onSave}>
            {saveLabel ?? t("recordForm.save")}
          </Button>
        </>
      }
    >
      {error ? (
        <div
          role="alert"
          className="border-b border-erp-error-border bg-erp-error-bg px-3 py-2 text-[11px] text-erp-error"
        >
          {error}
        </div>
      ) : null}
      {children}
    </Modal>
  );
}
