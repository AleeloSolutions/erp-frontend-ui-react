import type { ReactNode } from "react";
import { cn } from "@erp/ui";

export interface SettingsOverviewLinkProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

export function SettingsOverviewLink({
  children,
  onClick,
  className,
}: SettingsOverviewLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "m-0 border-0 bg-transparent p-0 text-left text-sm text-erp-brand-third hover:underline",
        className
      )}
    >
      → {children}
    </button>
  );
}
