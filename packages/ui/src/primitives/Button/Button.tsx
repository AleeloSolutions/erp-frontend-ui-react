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
    "bg-erp-blue border-erp-blue text-white hover:brightness-95 shadow-[0_4px_10px_rgba(30,78,140,0.14)]",
  secondary:
    "bg-white border-erp-input-border text-erp-text hover:bg-[#F7F9FB]",
  teal: "bg-erp-teal border-erp-teal text-white hover:brightness-95",
  danger: "bg-erp-error border-erp-error text-white hover:brightness-95",
  ghost:
    "bg-transparent border-transparent text-erp-muted hover:bg-[#F5F8FC] hover:border-[#D9E2EC]",
  outline:
    "bg-white border-erp-input-border text-erp-text hover:bg-[#F7F9FB]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[10.5px]",
  md: "h-[30px] px-2.5 text-[11px]",
  lg: "h-8 px-3 text-[11px]",
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
          "inline-flex items-center justify-center gap-1.5 rounded-[7px] border font-bold transition-[filter,background-color,border-color] disabled:cursor-not-allowed disabled:opacity-50",
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
