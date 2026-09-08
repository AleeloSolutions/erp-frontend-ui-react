/**
 * Route guard for the platform surface: platform accounts only.
 *
 * A tenant account that types the URL gets the not-found treatment, the
 * same answer the API gives it (404, never 403): the platform's screens
 * are not something to confirm the existence of. While the session is
 * still unknown the children render; the API is the boundary.
 */

import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/app/session";

export function RequirePlatform({ children }: { children: ReactElement }) {
  const session = useSession();
  if (session === null || session.user_type === "platform") return children;
  return <Navigate to="/" replace />;
}
