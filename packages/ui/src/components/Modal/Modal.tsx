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
  bodyClassName?: string;
  footerClassName?: string;
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
  /** Backdrop classes. Defaults to `bg-erp-overlay`. */
  overlayClassName?: string;
  /** Defaults to false for `fullscreen`, true otherwise. */
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "w-full max-w-[min(1200px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)]",
  fullscreen:
    "absolute inset-4 flex max-h-none w-auto flex-col overflow-hidden rounded-lg border border-erp-border bg-erp-surface shadow-lg",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  footerClassName,
  size = "md",
  overlayClassName = "bg-erp-overlay",
  closeOnOverlayClick,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const isFullscreen = size === "fullscreen";
  const isTallModal = isFullscreen || size === "xl";
  const dismissOnOverlay = closeOnOverlayClick ?? !isFullscreen;

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
    <div
      className={cn(
        "fixed inset-0 z-[100]",
        isFullscreen ? "p-0" : "flex items-center justify-center p-4"
      )}
    >
      <button
        type="button"
        aria-label="Close dialog overlay"
        className={cn("absolute inset-0", overlayClassName)}
        onClick={dismissOnOverlay ? onClose : undefined}
        tabIndex={dismissOnOverlay ? 0 : -1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-[101] overflow-hidden bg-erp-surface shadow-lg",
          isTallModal
            ? cn("flex flex-col rounded-lg border border-erp-border", sizeClasses[size])
            : cn("w-full border border-erp-border", sizeClasses[size]),
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
        <div
          className={cn(
            isTallModal ? "min-h-0 flex-1 overflow-hidden p-0" : "p-3",
            bodyClassName
          )}
        >
          {children}
        </div>
        {footer ? (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 border-t border-erp-border bg-erp-surface-alt px-4 py-3",
              footerClassName
            )}
          >
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
