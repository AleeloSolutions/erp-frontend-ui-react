import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { navigationFor } from "./access";
import { coreNavigation, mobileNavigation } from "./navigation";
import { displayName, roleLabel, useSession } from "./session";

export function AppShell({
  navigationItems = coreNavigation,
  mobileNavItems = mobileNavigation,
  ...props
}: AppShellProps) {
  const session = useSession();
  const name = displayName(session);

  return (
    <UiAppShell
      // The footer used to name a sample person no matter who was signed in.
      sidebarUser={
        session
          ? {
              userName: name,
              userRole: roleLabel(session),
              userInitials: name.slice(0, 2).toUpperCase(),
            }
          : undefined
      }
      // Offer only what this account can actually open. The API refuses
      // the rest regardless; this keeps the sidebar honest about it.
      navigationItems={navigationFor(navigationItems, session?.permissions ?? null)}
      mobileNavItems={mobileNavItems}
      {...props}
    />
  );
}
