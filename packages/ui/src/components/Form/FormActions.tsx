import type { ReactNode } from "react";
import { cn } from "../../utils";
import { Button } from "../../primitives/Button";

export interface FormActionsProps {
  onCancel?: () => void;
  cancelLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  disabled?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  /** When true, renders only custom left/right slots without default buttons */
  customOnly?: boolean;
}

export function FormActions({
  onCancel,
  cancelLabel = "Cancel",
  secondaryLabel = "Save draft",
  onSecondary,
  submitLabel = "Submit",
  submitting = false,
  disabled = false,
  left,
  right,
  className,
  customOnly = false,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 border-t border-erp-border bg-erp-surface-alt px-2.5 py-1.5",
        className
      )}
    >
      {left}
      {!customOnly && onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          {cancelLabel}
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {right}
        {!customOnly ? (
          <>
            {onSecondary ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onSecondary}
                disabled={submitting || disabled}
              >
                {secondaryLabel}
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="teal"
              loading={submitting}
              disabled={disabled}
            >
              {submitLabel}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
