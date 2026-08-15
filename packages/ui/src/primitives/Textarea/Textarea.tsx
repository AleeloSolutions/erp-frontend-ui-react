import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "min-h-[76px] w-full resize-y rounded-md border border-erp-input-border bg-white px-2.5 py-2 text-xs text-erp-text shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] placeholder:text-[#94A3B8]",
          "focus:border-erp-blue focus:outline-2 focus:outline-erp-focus focus:-outline-offset-1",
          "disabled:cursor-not-allowed disabled:bg-erp-surface-alt disabled:opacity-60",
          error && "border-erp-error focus:border-erp-error",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
