import type { ReactNode } from "react";
import { cn } from "../../utils";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      // Desktop `pb-[26px]` — keep in sync with `PAGE_CONTAINER_BOTTOM_PADDING`
      // in `../stickyOffsets`, which DataTable's capped inner scroll relies on.
      className={cn(
        "px-0 pb-[26px] max-[720px]:px-2.5 max-[720px]:pb-[70px] max-[720px]:pt-2.5",
        className
      )}
    >
      {children}
    </div>
  );
}
