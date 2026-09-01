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

/** True when the page is already being served from this tenant's subdomain. */
export function onTenantHost(slug: string): boolean {
  const { hostname } = window.location;
  return hostname === `${slug}.${rootDomain(hostname)}`;
}
