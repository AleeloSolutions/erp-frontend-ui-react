import type { ReactNode } from "react";
import { cn } from "../../utils";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "px-0 pb-[26px] max-[720px]:px-2.5 max-[720px]:pb-[70px] max-[720px]:pt-2.5",
        className
      )}
    >
      {children}
    </div>
  );
}
