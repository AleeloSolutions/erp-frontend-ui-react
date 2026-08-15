import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { mobileNavigation, navigation } from "./navigation";

export function AppShell({
  navigationItems = navigation,
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
