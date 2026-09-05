/**
 * Getting an authenticated session onto its workspace.
 *
 * JWTs live in per-origin storage, so a session held on the platform
 * domain cannot simply follow a link to the tenant subdomain: it crosses
 * once, with a single-use handoff token. Shared by the login form and by
 * the guard that keeps an already-signed-in visitor off it.
 */

import { onTenantHost, tenantOrigin } from "@/lib/tenant";
import { fetchMe, requestWorkspaceHandoff } from "./api";

/**
 * Sends the browser to this account's workspace when it is somewhere
 * else. Returns true when a redirect has been started -- the caller must
 * then do nothing further, since the page is on its way out.
 */
export async function crossToWorkspace(): Promise<boolean> {
  const me = await fetchMe();
  if (!me.client || onTenantHost(me.client.slug)) return false;

  const { token } = await requestWorkspaceHandoff();
  window.location.assign(
    `${tenantOrigin(me.client.slug)}/welcome?token=${encodeURIComponent(token)}`
  );
  return true;
}
