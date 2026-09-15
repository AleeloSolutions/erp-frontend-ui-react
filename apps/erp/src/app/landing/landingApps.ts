export type LandingApp = {
  kind: string;
  labelKey: `apps.${string}`;
  to: string;
};

/** Live module entry points — only routes that exist in the app today. */
export const LANDING_APPS: LandingApp[] = [
  { kind: "crm", labelKey: "apps.customers", to: "/sales/customers" },
  { kind: "documents", labelKey: "apps.orders", to: "/sales" },
  { kind: "accounting", labelKey: "apps.products", to: "/sales/products" },
  { kind: "dashboard", labelKey: "apps.dashboard", to: "/dashboard" },
];

export const LANDING_NAV = [
  { href: "#apps", labelKey: "nav.modules" as const },
  { href: "#features", labelKey: "nav.platform" as const },
  { href: "#start", labelKey: "nav.getStarted" as const },
];
