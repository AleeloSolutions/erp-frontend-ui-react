import { forwardRef, type TextareaHTMLAttributes } from "react";
import {
  cn,
  fieldChromeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  /** Visual size. Defaults to `sm`. Height is fixed; use className for width. */
  size?: FieldSize;
  /** Field border treatment. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      style,
      disabled,
      rows = 1,
      size = "sm",
      chrome,
      chromeEdge,
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        {...props}
        ref={ref}
        rows={rows}
        disabled={disabled}
        aria-invalid={error || undefined}
        data-size={size}
        data-chrome={chrome}
        data-chrome-edge={chromeEdge}
        style={{ outline: "none", boxShadow: "none", ...style }}
        className={cn(
          "min-w-0 max-w-full min-h-0 resize-y",
          fieldChromeClasses({ error, chrome, chromeEdge }),
          fieldSizeClasses[size],
          className
        )}
      />
    );
  }
);

Textarea.displayName = "Textarea";
