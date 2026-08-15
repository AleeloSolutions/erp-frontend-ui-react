import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "../../utils";
import { Button } from "../../primitives/Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = "md",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-[rgba(16,42,67,0.45)]"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-[101] w-full overflow-hidden rounded-lg border border-erp-border bg-white shadow-[0_16px_40px_rgba(16,42,67,0.18)]",
          sizeClasses[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-erp-border bg-erp-surface-alt px-3 py-2.5">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="m-0 text-[15px] font-bold text-erp-text">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-0.5 mb-0 text-[11px] text-erp-subtle">
                  {description}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="p-3">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-1.5 border-t border-erp-border bg-erp-surface-alt px-3 py-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-[12px] text-erp-text", className)} {...props}>
      {children}
    </div>
  );
}
