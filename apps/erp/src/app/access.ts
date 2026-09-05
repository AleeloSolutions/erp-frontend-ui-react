/**
 * Which parts of the app a user is offered.
 *
 * Every entry maps to permission codes from `/api/v1/access-modules/`:
 * holding any one of them means the module has something to show. This
 * only decides what is *offered* — the API is what refuses, and it does
 * so whether or not the navigation hid the link.
 */

import type { NavigationItem } from "@erp/ui";

/** Nav key -> the codes that make it worth showing. Empty = always shown. */
export const NAV_REQUIREMENTS: Record<string, string[]> = {
  dashboard: [],
  sales: [
    "sales.customer.view",
    "sales.quotation.view",
    "sales.invoice.view",
    "sales.contract.view",
    "sales.order.view",
  ],
  inventory: ["inv.product.view", "inv.movement.view"],
  reports: ["reports.statement.view"],
  settings: [
    "settings.client.update",
    "settings.document_layout.update",
    "settings.user.manage",
    "settings.role.manage",
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
