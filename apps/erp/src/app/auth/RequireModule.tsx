/**
 * Route guard for a module: its URLs exist only while the tenant has the
 * module installed.
 *
 * `me.enabled_modules` is the SPA's single source for this, the same
 * answer the installer changes. The API is the real boundary -- every
 * route of a module the tenant lacks is a 404 there -- so this exists to
 * give a typed URL the same answer a URL that never existed gets, rather
 * than a shell that half-loads and then fails on every request behind
 * it. Which is why the fallback is the not-found treatment (back to
 * "/"), not a "no access" screen: a module that is not installed is not
 * something to describe.
 */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { isModuleEnabled } from "@/app/access";
import { useSession } from "@/app/session";

export function RequireModule({
  module,
  children,
}: {
  /** The backend module key, as the manifest's `key`. */
  module: string;
  children: ReactElement;
}) {
  const session = useSession();
  if (isModuleEnabled(session, module)) return children;
  return <Navigate to="/" replace />;
}
