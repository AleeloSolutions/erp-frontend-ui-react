import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
        <input
          ref={ref}
          id={id}
          type="radio"
          className={cn(
            "h-4 w-4 appearance-none rounded-full border border-erp-border-control bg-white",
            "checked:border-erp-blue checked:bg-white",
            "checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-2 checked:after:w-2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:rounded-full checked:after:bg-erp-blue checked:after:content-['']",
            "relative grid place-items-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erp-blue-mid/16",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  }
);

Radio.displayName = "Radio";
