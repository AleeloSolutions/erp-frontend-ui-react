/**
 * Route guard for a module: the URL is reachable only if the account
 * holds one of the codes that module needs.
 *
 * The API refuses regardless — this exists so someone who types the URL
 * gets a plain answer instead of a screen that half-loads and then fails
 * on every request behind it.
 */

import type { ReactElement } from "react";
import { Lock } from "lucide-react";
import { AppShell, useNavbarDefaults } from "@/app";
import { holdsAny } from "@/app/access";
import { useSession } from "@/app/session";

export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: string[];
  children: ReactElement;
}) {
  const session = useSession();

  // While the session is unknown the children render: the API is still the
  // boundary, and blanking the page on every navigation would be worse.
  if (holdsAny(session?.permissions ?? null, anyOf)) return children;

  return <NoAccess />;
}

function NoAccess() {
  const navbar = useNavbarDefaults({ brandLabel: "No access" });
  return (
    <AppShell navbar={navbar}>
      <div className="mx-4 mt-4 grid place-items-center rounded-sm border border-erp-border bg-white px-4 py-16 text-center">
        <Lock className="h-6 w-6 text-erp-muted" aria-hidden />
        <h1 className="m-0 mt-3 text-[15px] font-bold text-erp-text">
          You do not have access to this
        </h1>
        <p className="m-0 mt-1 max-w-sm text-[12px] text-erp-muted">
          Ask whoever manages your workspace to grant it under Settings → Users.
        </p>
      </div>
    </AppShell>
  );
}
