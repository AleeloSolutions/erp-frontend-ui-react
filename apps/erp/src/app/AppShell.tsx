import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { navigationFor } from "./access";
import { coreNavigation, mobileNavigation } from "./navigation";
import { useSession } from "./session";

export function AppShell({
  navigationItems = coreNavigation,
  mobileNavItems = mobileNavigation,
  ...props
}: AppShellProps) {
  const session = useSession();

  return (
    <UiAppShell
      // Offer only what this account can actually open. The API refuses
      // the rest regardless; this keeps the sidebar honest about it.
      navigationItems={navigationFor(navigationItems, session?.permissions ?? null)}
      mobileNavItems={mobileNavItems}
      {...props}
    />
  );
}
