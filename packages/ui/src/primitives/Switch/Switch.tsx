import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 text-[11px] text-erp-text",
          props.disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span className="relative inline-flex h-[18px] w-[32px] items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full border border-erp-border-control bg-erp-header transition-colors",
              "peer-checked:border-erp-blue peer-checked:bg-erp-blue",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-erp-blue-mid/16",
              "peer-disabled:opacity-60"
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute left-[2px] h-[12px] w-[12px] rounded-full bg-erp-surface shadow-sm transition-transform",
              "peer-checked:translate-x-[14px]"
            )}
          />
        </span>
        {label ? <span>{label}</span> : null}
      </label>
    );
  }
);

Switch.displayName = "Switch";
