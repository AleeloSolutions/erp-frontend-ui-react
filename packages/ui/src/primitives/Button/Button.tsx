import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils";
import type { ButtonSize, ButtonVariant } from "../../types/common";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-btn-hover border-btn-hover text-erp-primary-foreground hover:bg-nav hover:border-nav active:bg-nav active:border-nav-active shadow-md",
  secondary:
    "bg-erp-secondary border-erp-secondary-border text-erp-secondary-foreground hover:bg-erp-secondary-hover",
  teal: "bg-erp-teal border-erp-teal text-white hover:brightness-95",
  danger:
    "bg-erp-danger border-erp-danger text-erp-danger-foreground hover:brightness-95",
  ghost:
    "bg-transparent border-transparent text-erp-muted hover:bg-erp-surface-muted hover:border-erp-border-strong",
  outline:
    " border-erp-primary-border text-erp-primary hover:bg-erp-primary hover:text-erp-primary-foreground  active:shadow-md active:brightness-95",
};

// Auto height (padding + line-height), not a fixed h-*, per spec.
const textButtonSize =
  "px-[0.625rem] py-[0.3125rem] text-[0.875rem] font-[500] leading-[1.5]";

const sizeClasses: Record<ButtonSize, string> = {
  sm: textButtonSize,
  md: textButtonSize,
  lg: textButtonSize,
  // Fixed square icon-only button — the text box model above doesn't apply.
  icon: "h-7 w-7 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-[4px] border font-bold transition-[filter,background-color,border-color] disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
