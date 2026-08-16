import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn, fieldChromeClasses, fieldSizeClasses, type FieldSize } from "../../utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed; use className for width. */
  size?: FieldSize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, style, disabled, rows = 1, size = "sm", ...props }, ref) => {
    return (
      <textarea
        {...props}
        ref={ref}
        rows={rows}
        disabled={disabled}
        aria-invalid={error || undefined}
        data-size={size}
        style={{ outline: "none", boxShadow: "none", ...style }}
        className={cn(
          "min-w-0 max-w-full min-h-0 resize-y",
          fieldChromeClasses({ error }),
          fieldSizeClasses[size],
          className
        )}
      />
    );
  }
);

Textarea.displayName = "Textarea";
