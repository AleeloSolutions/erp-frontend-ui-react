import type { ReactNode } from "react";
import { cn } from "../../utils";
import { NAVBAR_HEIGHT } from "../stickyOffsets";

export interface FormStickyHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Sticky stack for form pages: breadcrumb ControlPanel + FormStatusBar share
 * one sticky layer under the Navbar so they never open a gap while scrolling.
 * Pass `sticky={false}` to both children.
 */
export function FormStickyHeader({ children, className }: FormStickyHeaderProps) {
  return (
    <div
      data-form-sticky-header
      style={{ top: NAVBAR_HEIGHT }}
      className={cn("sticky z-20 bg-white", className)}
    >
      {children}
    </div>
  );
}
