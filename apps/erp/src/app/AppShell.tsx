import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { coreNavigation, mobileNavigation } from "./navigation";

export function AppShell({
  navigationItems = coreNavigation,
  mobileNavItems = mobileNavigation,
  ...props
}: AppShellProps) {
  return (
    <UiAppShell
      navigationItems={navigationItems}
      mobileNavItems={mobileNavItems}
      {...props}
    />
  );
}
