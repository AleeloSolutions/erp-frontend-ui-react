import type { ReactNode } from "react";
import { cn } from "@erp/ui";

export interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("border-b border-erp-border-soft last:border-b-0", className)}>
      <div className="border-b border-erp-border bg-erp-header px-4 py-2.5">
        <h2 className="m-0 text-[13px] font-bold text-erp-text">{title}</h2>
      </div>
      <div className="grid gap-8 bg-white p-6 min-[721px]:grid-cols-2">{children}</div>
    </section>
  );
}
