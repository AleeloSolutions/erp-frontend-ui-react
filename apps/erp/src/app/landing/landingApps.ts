export type LandingApp = {
  kind: string;
  labelKey: `apps.${string}`;
  to: string;
};

/** Live module entry points — only routes that exist in the app today. */
export const LANDING_APPS: LandingApp[] = [
  { kind: "crm", labelKey: "apps.customers", to: "/sales/customers" },
  { kind: "documents", labelKey: "apps.quotations", to: "/sales/quotations" },
  { kind: "accounting", labelKey: "apps.invoices", to: "/sales/invoices" },
  { kind: "inventory", labelKey: "apps.products", to: "/inventory/products" },
  { kind: "project", labelKey: "apps.reports", to: "/reports/balance-sheet" },
  { kind: "dashboard", labelKey: "apps.dashboard", to: "/dashboard" },
];

export const LANDING_NAV = [
  { href: "#apps", labelKey: "nav.modules" as const },
  { href: "#features", labelKey: "nav.platform" as const },
  { href: "#start", labelKey: "nav.getStarted" as const },
];
