import type { ReactNode } from "react";
import { Modal } from "../Modal";
import { Button } from "../../primitives/Button";
import { useUiTranslation } from "../../i18n";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "teal";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const { t } = useUiTranslation("ui");
  const resolvedConfirm = confirmLabel ?? t("confirm.confirm");
  const resolvedCancel = cancelLabel ?? t("confirm.cancel");

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {resolvedCancel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {resolvedConfirm}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
