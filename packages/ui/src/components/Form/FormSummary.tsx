import type { ReactNode } from "react";
import { cn } from "../../utils";
import type { FormSummaryItem } from "../../types/forms";

export interface FormSummaryProps {
  title?: string;
  items?: FormSummaryItem[];
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function FormSummary({
  title = "Summary",
  items = [],
  children,
  footer,
  className,
}: FormSummaryProps) {
  return (
    <aside
      className={cn(
        "border-t border-erp-border bg-erp-surface-tint-strong min-[981px]:border-l min-[981px]:border-t-0",
        className
      )}
    >
      <div className="border-b border-erp-border p-3">
        <h4 className="mb-2 mt-0 text-[10.5px] font-bold text-erp-text">{title}</h4>
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "my-1.5 flex items-start justify-between gap-2 text-[10.5px] text-erp-text",
              item.emphasize && "border-t border-erp-border pt-2 text-[13px] font-bold"
            )}
          >
            <span className={cn(!item.emphasize && "text-erp-muted")}>{item.label}</span>
            <strong className="text-right font-bold text-erp-text">{item.value}</strong>
          </div>
        ))}
        {children}
      </div>
      {footer ? (
        <div className="border-b border-erp-border p-3 text-[10px] leading-[1.9] text-erp-muted">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
