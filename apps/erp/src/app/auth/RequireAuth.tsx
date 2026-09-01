import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

/** Route guard: unauthenticated visitors go to /login (keeping where
 * they were headed so login can send them back). */
export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }
  return children;
}
