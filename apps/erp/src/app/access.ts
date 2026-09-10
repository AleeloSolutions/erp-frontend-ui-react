/**
 * Which parts of the app a user is offered.
 *
 * Every entry maps to permission codes from `/api/v1/permissions/matrix/`
 * (`<module>.<resource>.<action>`): holding any one of them means the
 * module has something to show. This only decides what is *offered* — the
 * API is what refuses, and it does so whether or not the navigation hid
 * the link.
 */

import type { NavigationItem } from "@erp/ui";
import type { ModuleManifest } from "@/modules/types";
import { isAuthenticated } from "@/lib/auth";

/** Seeing a module at all: at any rung of the ladder. */
export function viewing(...resources: string[]): string[] {
  return resources.flatMap((resource) => [
    `${resource}.view`,
    `${resource}.view_branch`,
    `${resource}.view_own`,
  ]);
}

/** Every rung of a verb: holding a narrower one still opens the screen. */
function anyScope(resource: string, verb: string): string[] {
  return [`${resource}.${verb}`, `${resource}.${verb}_branch`, `${resource}.${verb}_own`];
}

export const SETTINGS_CODES = {
  company: ["settings.client.edit"],
  documentLayout: ["settings.document_layout.edit"],
  sales: ["settings.sales.edit"],
  users: [
    ...anyScope("settings.user", "create"),
    ...anyScope("settings.user", "edit"),
    ...anyScope("settings.user", "delete"),
  ],
  roles: ["settings.role.create", "settings.role.edit", "settings.role.delete"],
  branches: ["settings.branch.create", "settings.branch.edit", "settings.branch.delete"],
  modules: ["settings.module.view", "settings.module.edit"],
} as const;

/**
 * Codes that open Settings in the sidebar and the `/settings` route.
 *
 * Any grant that unlocks a Settings *tab* must open Settings. Branch
 * grants alone do not: there is no Branches tab, and they must not unlock
 * Users either.
 */
export const SETTINGS_ACCESS_CODES: string[] = [
  ...SETTINGS_CODES.company,
  ...SETTINGS_CODES.documentLayout,
  ...SETTINGS_CODES.sales,
  ...SETTINGS_CODES.users,
  ...SETTINGS_CODES.roles,
  ...SETTINGS_CODES.modules,
];

/** Nav key -> the codes that make it worth showing. Empty = always shown. */
export const NAV_REQUIREMENTS: Record<string, string[]> = {
  dashboard: [],
  sales: viewing("sales.customer", "sales.quotation", "sales.invoice", "sales.contract"),
  notes: viewing("notes.note"),
  settings: SETTINGS_ACCESS_CODES,
};

/**
 * Per-child sidebar / Sales-tab requirements.
 *
 * Holding any sales view code opens the Sales module; each child still needs
 * its own resource, or the list API returns 403 and the UI looks broken.
 */
export const CHILD_NAV_REQUIREMENTS: Record<string, Record<string, string[]>> = {
  sales: {
    customers: viewing("sales.customer"),
    quotations: viewing("sales.quotation"),
    invoices: viewing("sales.invoice"),
    contracts: viewing("sales.contract"),
  },
};

/**
 * The codes that make a module's nav entry worth showing: the ones listed
 * here for a compiled-in module, else the view rungs of the resources its
 * manifest names (how a packaged module says it). Neither known -> always
 * offered; the API still refuses what it must.
 */
export function navRequirementFor(
  module: Pick<ModuleManifest, "nav" | "resources">
): string[] {
  return NAV_REQUIREMENTS[module.nav.key] ?? viewing(...(module.resources ?? []));
}

export function holdsAny(codes: string[] | null, required: string[]): boolean {
  if (required.length === 0) return true;
  // Unknown yet while signed in (me/ still loading, or Storybook with a
  // mocked session path): offer everything rather than flashing empty.
  // Signed out (logout cleared tokens): offer nothing — otherwise every
  // Settings tab briefly appears before the login redirect.
  if (codes === null) return isAuthenticated();
  return required.some((code) => codes.includes(code));
}

/** The navigation this user should be offered, children filtered too. */
export function navigationFor(
  items: NavigationItem[],
  codes: string[] | null
): NavigationItem[] {
  return items.filter((item) => holdsAny(codes, NAV_REQUIREMENTS[item.key] ?? []));
}

/**
 * Whether the tenant has `module` installed, per `me.enabled_modules` --
 * the SPA's single source for which modules exist here. Unknown yet
 * (still loading, or Storybook): let it render, the same way `holdsAny`
 * does; the API answers 404 for a module the tenant lacks regardless.
 */
export function isModuleEnabled(
  session: { enabled_modules?: string[] } | null,
  module: string
): boolean {
  if (session === null) return true;
  return (session.enabled_modules ?? []).includes(module);
}
