import type { ReactNode } from "react";
import { cn } from "../../utils";
import { Sidebar } from "../Sidebar";
// import { MobileNav } from "../MobileNav"; // not in use currently
import { Navbar, type NavbarProps } from "../Navbar";
import { PageContainer } from "../PageContainer";
import type { MobileNavItem, NavigationItem } from "../../types/navigation";

export interface AppShellProps {
  children: ReactNode;
  navigationItems?: NavigationItem[];
  mobileNavItems?: MobileNavItem[];
  activeNavKey?: string;
  activeMobileKey?: string;
  /** Navbar configuration. When provided, renders at the top of the page container. */
  navbar?: NavbarProps;
  className?: string;
  contentClassName?: string;
}

export function AppShell({
  children,
  navigationItems = [],
  activeNavKey,
  navbar,
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div data-app-shell className={cn("min-h-screen", className)}>
      <Sidebar items={navigationItems} activeKey={activeNavKey} />
      <main className="min-w-0 min-[721px]:ms-[220px] max-[980px]:min-[721px]:ms-16">
        {navbar ? <Navbar {...navbar} /> : null}
        <PageContainer className={contentClassName}>{children}</PageContainer>
      </main>
      {/* <MobileNav items={mobileNavItems} activeKey={activeMobileKey} /> */}
    </div>
  );
}
