import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          "h-[30px] w-full rounded-md border border-erp-input-border bg-white px-2.5 text-[11px] text-erp-text shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] placeholder:text-[#94A3B8]",
          "focus:border-erp-blue focus:outline-2 focus:outline-erp-focus focus:-outline-offset-1",
          "disabled:cursor-not-allowed disabled:bg-erp-surface-alt disabled:opacity-60",
          error && "border-erp-error focus:border-erp-error focus:outline-erp-error-bg",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
