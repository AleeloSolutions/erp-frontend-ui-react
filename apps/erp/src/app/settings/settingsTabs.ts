import type { TabItem } from "@erp/ui";
import { SETTINGS_CODES, holdsAny } from "@/app/access";

export type SettingsTabKey =
  | "users"
  | "company"
  | "modules"
  | "document-layout"
  | "language"
  | "sales"
  | "accounting-stub"
  | "inventories-stub";

/** The codes each tab needs. A tab nobody can act on is not offered. */
export const SETTINGS_TAB_REQUIREMENTS: Record<SettingsTabKey, string[]> = {
  users: [...SETTINGS_CODES.users, ...SETTINGS_CODES.roles, ...SETTINGS_CODES.branches],
  company: [...SETTINGS_CODES.company],
  modules: [...SETTINGS_CODES.modules],
  "document-layout": [...SETTINGS_CODES.documentLayout],
  // Language shares the company grant.
  language: [...SETTINGS_CODES.company],
  // Sales settings write rides on Company Info edit (same as the API).
  sales: [...SETTINGS_CODES.company],
  "accounting-stub": [...SETTINGS_CODES.company],
  "inventories-stub": [...SETTINGS_CODES.company],
};

/** Flat list kept for callers/tests; Settings UI uses settingsTabsForModule. */
export const SETTINGS_TABS: TabItem[] = [
  { key: "company", label: "Company Info" },
  { key: "users", label: "Users" },
  { key: "document-layout", label: "Document Layout" },
  { key: "language", label: "Language" },
  { key: "modules", label: "Modules" },
];

/** The tabs this account may open, in order. Unknown codes (still
 * loading, or Storybook) show everything -- the API still refuses. */
export function settingsTabsFor(codes: string[] | null): TabItem[] {
  return SETTINGS_TABS.filter((tab) =>
    holdsAny(codes, SETTINGS_TAB_REQUIREMENTS[tab.key as SettingsTabKey])
  );
}
