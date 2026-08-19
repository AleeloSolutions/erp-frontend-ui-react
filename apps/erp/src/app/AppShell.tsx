import { useMemo } from "react";
import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { coreNavigation, mobileNavigation } from "./navigation";
import { useModuleRegistry } from "@/modules";

export function AppShell({
  navigationItems,
  mobileNavItems = mobileNavigation,
  ...props
}: AppShellProps) {
  const { installedModules } = useModuleRegistry();

  const resolvedNav = useMemo(() => {
    if (navigationItems) return navigationItems;
    return [...coreNavigation, ...installedModules.map((m) => m.nav)];
  }, [navigationItems, installedModules]);

  return (
    <UiAppShell
      navigationItems={resolvedNav}
      mobileNavItems={mobileNavItems}
      {...props}
    />
  );
}
