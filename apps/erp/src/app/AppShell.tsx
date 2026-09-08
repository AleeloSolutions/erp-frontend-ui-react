import { AppShell as UiAppShell, type AppShellProps } from "@erp/ui";
import { useModules } from "@/modules/registry";
import { navigationFor } from "./access";
import { buildNavigation, mobileNavigation } from "./navigation";
import { displayName, accountKindLabel, useSession } from "./session";

export function AppShell({
  navigationItems,
  mobileNavItems = mobileNavigation,
  ...props
}: AppShellProps) {
  const session = useSession();
  // The live registry: a packaged module that registers while this shell
  // is mounted appears in the sidebar at once.
  const modules = useModules();
  const name = displayName(session);

  return (
    <UiAppShell
      // The footer used to name a sample person no matter who was signed in.
      sidebarUser={
        session
          ? {
              userName: name,
              userRole: accountKindLabel(session),
              userInitials: name.slice(0, 2).toUpperCase(),
            }
          : undefined
      }
      // Offer only what this account can actually open: the modules the
      // tenant has installed, then only those with a code behind them. The
      // API refuses the rest regardless; this keeps the sidebar honest.
      // A caller passing its own items still gets the permission filter.
      navigationItems={
        navigationItems
          ? navigationFor(navigationItems, session?.permissions ?? null)
          : buildNavigation(session, modules)
      }
      mobileNavItems={mobileNavItems}
      {...props}
    />
  );
}
