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

/** Seeing a module at all: everything, or only your own records. */
function viewing(...resources: string[]): string[] {
  return resources.flatMap((resource) => [`${resource}.view`, `${resource}.view_own`]);
}

export const SETTINGS_CODES = {
  company: ["settings.client.edit"],
  documentLayout: ["settings.document_layout.edit"],
  users: ["settings.user.create", "settings.user.edit", "settings.user.delete"],
  roles: ["settings.role.create", "settings.role.edit", "settings.role.delete"],
} as const;

/** Nav key -> the codes that make it worth showing. Empty = always shown. */
export const NAV_REQUIREMENTS: Record<string, string[]> = {
  dashboard: [],
  sales: viewing(
    "sales.customer",
    "sales.quotation",
    "sales.invoice",
    "sales.contract",
    "sales.order"
  ),
  inventory: viewing("inv.product", "inv.movement"),
  reports: ["reports.statement.view"],
  settings: [
    ...SETTINGS_CODES.company,
    ...SETTINGS_CODES.documentLayout,
    ...SETTINGS_CODES.users,
    ...SETTINGS_CODES.roles,
  ],
};

export function holdsAny(codes: string[] | null, required: string[]): boolean {
  if (required.length === 0) return true;
  // Unknown yet (still loading, or Storybook): offer everything rather than
  // flashing an empty sidebar. The API still refuses what it must.
  if (codes === null) return true;
  return required.some((code) => codes.includes(code));
}

/** The navigation this user should be offered, children filtered too. */
export function navigationFor(
  items: NavigationItem[],
  codes: string[] | null
): NavigationItem[] {
  return items.filter((item) => holdsAny(codes, NAV_REQUIREMENTS[item.key] ?? []));
}
