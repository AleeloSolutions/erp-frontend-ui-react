import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils";
import type { SelectOption } from "../../types/common";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options = [], placeholder, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "h-[30px] w-full rounded-md border border-erp-input-border bg-white px-2.5 text-[11px] text-erp-text shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
          "focus:border-erp-blue focus:outline-2 focus:outline-erp-focus focus:-outline-offset-1",
          "disabled:cursor-not-allowed disabled:bg-erp-surface-alt disabled:opacity-60",
          error && "border-erp-error focus:border-erp-error",
          className
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        ) : null}
        {children ??
          options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
      </select>
    );
  }
);

Select.displayName = "Select";
