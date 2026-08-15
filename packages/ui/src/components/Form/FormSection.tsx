import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils";

export interface FormSectionProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn("border-b border-erp-border p-[13px]", className)}
      {...props}
    >
      <h3 className="mb-2.5 mt-0 text-[11px] font-bold text-[#4E5D6C]">{title}</h3>
      {description ? (
        <p className="mb-2.5 mt-[-6px] text-[10.5px] text-erp-subtle">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
