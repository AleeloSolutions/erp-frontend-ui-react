import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn, fieldChromeClasses, fieldSizeClasses, type FieldSize } from "../../utils";

export type InputSize = FieldSize;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed; use className for width. */
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      type = "text",
      size = "sm",
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
        style={{ outline: "none", boxShadow: "none", ...style }}
        className={cn(
          "min-w-0 max-w-full appearance-none",
          // Hide number spinners so chrome matches text fields
          type === "number" &&
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          fieldChromeClasses({ error }),
          fieldSizeClasses[size],
          className
        )}
      />
    );
  }
);

Input.displayName = "Input";
