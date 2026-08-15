import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils";

export interface FormGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 12;
  children: ReactNode;
}

export function FormGrid({
  columns = 12,
  className,
  children,
  ...props
}: FormGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-3 gap-y-2.5",
        columns === 12 && "min-[721px]:grid-cols-12",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
