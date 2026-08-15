import type { HTMLAttributes } from "react";
import { cn } from "../../utils";
import type { StatusVariant } from "../../types/common";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusVariant | string;
  label?: string;
}

const statusClasses: Record<StatusVariant, string> = {
  paid: "bg-erp-success-bg text-erp-success",
  pending: "bg-erp-warning-bg text-erp-warning",
  approved: "bg-erp-info-bg text-erp-info",
  overdue: "bg-erp-error-bg text-erp-error",
  draft: "bg-[#EEF1F4] text-[#5F6875]",
  partial: "bg-erp-purple-bg text-erp-purple",
  active: "bg-erp-info-bg text-erp-info",
  inactive: "bg-[#EEF1F4] text-[#5F6875]",
  open: "bg-erp-warning-bg text-erp-warning",
  closed: "bg-erp-success-bg text-erp-success",
};

const statusLabels: Record<StatusVariant, string> = {
  paid: "Paid",
  pending: "Pending",
  approved: "Approved",
  overdue: "Overdue",
  draft: "Draft",
  partial: "Partially paid",
  active: "Active",
  inactive: "Inactive",
  open: "Open",
  closed: "Closed",
};

function resolveStatus(status: string): StatusVariant {
  const value = status.toLowerCase().trim();

  if (value.includes("partial")) return "partial";
  if (value.includes("paid") && !value.includes("partial")) return "paid";
  if (value.includes("pending")) return "pending";
  if (value.includes("approved")) return "approved";
  if (value.includes("overdue")) return "overdue";
  if (value.includes("draft")) return "draft";
  if (value.includes("inactive")) return "inactive";
  if (value.includes("active")) return "active";
  if (value.includes("closed")) return "closed";
  if (value.includes("open")) return "open";

  return "draft";
}

export function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const resolved = resolveStatus(status);
  const display =
    label ??
    (resolved in statusLabels && status.toLowerCase() === resolved
      ? statusLabels[resolved]
      : status);

  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-full px-1.5 text-[9px] font-bold tracking-[0.02em]",
        statusClasses[resolved],
        className
      )}
      {...props}
    >
      {display}
    </span>
  );
}
