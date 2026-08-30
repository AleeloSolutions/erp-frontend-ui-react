import type { ReactNode } from "react";
import { cn } from "@erp/ui";

export interface SettingsOverviewTileProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SettingsOverviewTile({
  icon,
  title,
  description,
  action,
  className,
}: SettingsOverviewTileProps) {
  return (
    <div className={cn("flex gap-3 border-s-2 border-erp-border ps-4", className)}>
      {icon ? <div className="shrink-0 pt-0.5 text-erp-text">{icon}</div> : null}
      <div className="min-w-0 space-y-1">
        {title ? (
          <div className="text-sm font-semibold text-erp-text">{title}</div>
        ) : null}
        {description ? <div className="text-sm text-erp-muted">{description}</div> : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
