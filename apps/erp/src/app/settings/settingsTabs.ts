import type { TabItem } from "@erp/ui";
import { SETTINGS_CODES, holdsAny } from "@/app/access";

export type SettingsTabKey =
  "users" | "company" | "modules" | "document-layout" | "language" | "sales";

/** The codes each tab needs. A tab nobody can act on is not offered. */
export const SETTINGS_TAB_REQUIREMENTS: Record<SettingsTabKey, string[]> = {
  // Users / roles only — branch grants must not open the Users tab.
  users: [...SETTINGS_CODES.users, ...SETTINGS_CODES.roles],
  company: [...SETTINGS_CODES.company],
  modules: [...SETTINGS_CODES.modules],
  "document-layout": [...SETTINGS_CODES.documentLayout],
  // Locale lives on the company settings row (same API as Company Info).
  language: [...SETTINGS_CODES.company],
  // Invoicing defaults — dedicated tick, not Company profile.
  sales: [...SETTINGS_CODES.sales],
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
