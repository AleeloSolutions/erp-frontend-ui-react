import type { ReactNode } from "react";
import { cn } from "../../utils";
import { Sidebar } from "../Sidebar";
import { MobileNav } from "../MobileNav";
import { PageContainer } from "../PageContainer";
import type { MobileNavItem, NavigationItem } from "../../types/navigation";

export interface AppShellProps {
  children: ReactNode;
  navigationItems?: NavigationItem[];
  mobileNavItems?: MobileNavItem[];
  activeNavKey?: string;
  activeMobileKey?: string;
  className?: string;
  contentClassName?: string;
}

export function AppShell({
  children,
  navigationItems = [],
  mobileNavItems = [],
  activeNavKey,
  activeMobileKey,
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen min-[721px]:grid min-[721px]:grid-cols-[220px_1fr] max-[980px]:min-[721px]:grid-cols-[64px_1fr]",
        className
      )}
    >
      <Sidebar items={navigationItems} activeKey={activeNavKey} />
      <main className="min-w-0">
        <PageContainer className={contentClassName}>{children}</PageContainer>
      </main>
      <MobileNav items={mobileNavItems} activeKey={activeMobileKey} />
    </div>
  );
}
