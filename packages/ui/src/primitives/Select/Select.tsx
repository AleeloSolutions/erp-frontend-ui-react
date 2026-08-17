import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import {
  cn,
  fieldChromeClasses,
  fieldIconSizeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";
import type { SelectOption } from "../../types/common";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  options?: SelectOption[];
  placeholder?: string;
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed; use className for width. */
  size?: FieldSize;
  /** Field border treatment. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options = [],
      placeholder,
      error,
      children,
      style,
      disabled,
      size = "sm",
      chrome,
      chromeEdge,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative min-w-0 max-w-full", className)}>
        <select
          {...props}
          ref={ref}
          disabled={disabled}
          aria-invalid={error || undefined}
          data-size={size}
          data-chrome={chrome}
          data-chrome-edge={chromeEdge}
          style={{ outline: "none", boxShadow: "none", ...style }}
          className={cn(
            "w-full min-w-0 appearance-none pe-7",
            "[&:has(option[value='']:checked)]:text-erp-placeholder",
            fieldChromeClasses({ error, chrome, chromeEdge }),
            fieldSizeClasses[size]
          )}
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
        <ChevronDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute end-1.5 top-1/2 -translate-y-1/2 text-erp-subtle",
            fieldIconSizeClasses[size]
          )}
        />
      </div>
    );
  }
);

Select.displayName = "Select";
