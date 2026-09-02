/**
 * Tenant subdomain helpers. One wildcard DNS record serves every tenant;
 * the backend decides which subdomains are real, the frontend only needs
 * to BUILD tenant URLs from a slug.
 */

/** Root domain of the current host: hodan-store.localhost -> localhost,
 * hodan-store.erpeast.com -> erpeast.com, localhost -> localhost. */
function rootDomain(hostname: string): string {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }
  const parts = hostname.split(".");
  return parts.length >= 3 ? parts.slice(1).join(".") : hostname;
}

/** Origin for a tenant slug on the current deployment,
 * e.g. "hodan-store" -> http://hodan-store.localhost:5173. */
export function tenantOrigin(slug: string): string {
  const { protocol, hostname, port } = window.location;
  const host = `${slug}.${rootDomain(hostname)}${port ? `:${port}` : ""}`;
  return `${protocol}//${host}`;
}

/** Origin of the platform's own marketing/login site (the apex domain). */
export function platformOrigin(): string {
  const { protocol, hostname, port } = window.location;
  const host = `${rootDomain(hostname)}${port ? `:${port}` : ""}`;
  return `${protocol}//${host}`;
}

/** True when the page is already being served from this tenant's subdomain. */
export function onTenantHost(slug: string): boolean {
  const { hostname } = window.location;
  return hostname === `${slug}.${rootDomain(hostname)}`;
}

/** Subdomains that are the platform itself, never a tenant -- mirrors
 * Django's NON_TENANT_SUBDOMAINS. Keep the two lists in sync. */
const NON_TENANT_SUBDOMAINS = ["www", "api"];

/** Tenant slug for the current host, or null on the platform's own
 * domains (apex / www) where the marketing site and login live. */
export function currentTenantSlug(): string | null {
  const { hostname } = window.location;
  const base = rootDomain(hostname);
  if (hostname === base || !hostname.endsWith(`.${base}`)) return null;
  const slug = hostname.slice(0, -(base.length + 1));
  if (!slug || slug.includes(".") || NON_TENANT_SUBDOMAINS.includes(slug)) return null;
  return slug;
}
