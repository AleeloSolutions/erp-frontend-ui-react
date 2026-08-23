import { forwardRef, useId, type InputHTMLAttributes } from "react";
import {
  cn,
  fieldChromeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";

export type InputSize = FieldSize;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed; use className for width. */
  size?: InputSize;
  /** Field border treatment. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      type = "text",
      size = "sm",
      chrome,
      chromeEdge,
      id,
      disabled,
      style,
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <input
        {...props}
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error || undefined}
        data-size={size}
        data-chrome={chrome}
        data-chrome-edge={chromeEdge}
        style={{ outline: "none", boxShadow: "none", ...style }}
        className={cn(
          "min-w-0 max-w-full appearance-none",
          // Hide number spinners so chrome matches text fields
          type === "number" &&
            "[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          fieldChromeClasses({ error, chrome, chromeEdge }),
          fieldSizeClasses[size],
          className
        )}
      />
    );
  }
);

Input.displayName = "Input";
