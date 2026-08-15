import type { HTMLAttributes } from "react";
import { cn } from "../../utils";

export type BadgeVariant =
  | "default"
  | "blue"
  | "teal"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#EEF1F4] text-[#5F6875]",
  blue: "bg-erp-blue-50 text-erp-blue",
  teal: "bg-[#E6F7F5] text-erp-teal",
  success: "bg-erp-success-bg text-erp-success",
  warning: "bg-erp-warning-bg text-erp-warning",
  error: "bg-erp-error-bg text-erp-error",
  info: "bg-erp-info-bg text-erp-info",
  purple: "bg-erp-purple-bg text-erp-purple",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-full px-1.5 text-[9px] font-bold tracking-[0.02em]",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
