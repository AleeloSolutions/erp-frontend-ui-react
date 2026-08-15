import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { cn } from "../../utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, indeterminate = false, ...props }, ref) => {
    const localRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (localRef.current) {
        localRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

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
          ref={(node) => {
            localRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="checkbox"
          className={cn(
            "relative h-4 w-4 appearance-none rounded border border-[#C8D2DE]",
            "bg-gradient-to-b from-white to-[#F8FAFC]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_1px_rgba(16,42,67,0.05)]",
            "checked:border-[#2E5FA7] checked:bg-gradient-to-b checked:from-[#3A6FB3] checked:to-[#2E5FA7]",
            "checked:after:absolute checked:after:left-[3px] checked:after:top-[1px] checked:after:h-[5px] checked:after:w-2 checked:after:rotate-[-45deg] checked:after:border-b-2 checked:after:border-l-2 checked:after:border-white checked:after:content-['']",
            "indeterminate:border-[#2E5FA7] indeterminate:bg-gradient-to-b indeterminate:from-[#3A6FB3] indeterminate:to-[#2E5FA7]",
            "indeterminate:after:absolute indeterminate:after:left-[3px] indeterminate:after:top-[6px] indeterminate:after:h-0.5 indeterminate:after:w-2 indeterminate:after:rounded-sm indeterminate:after:bg-white indeterminate:after:content-['']",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(46,95,167,0.16)]",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
