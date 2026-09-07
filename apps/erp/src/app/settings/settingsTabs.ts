import type { TabItem } from "@erp/ui";
import { SETTINGS_CODES, holdsAny } from "@/app/access";

export type SettingsTabKey = "users" | "company" | "document-layout";

/** The codes each tab needs. A tab nobody can act on is not offered --
 * seeing the workspace's people or company details is not something a
 * "Document Layout only" grant should include. */
export const SETTINGS_TAB_REQUIREMENTS: Record<SettingsTabKey, string[]> = {
  users: [...SETTINGS_CODES.users, ...SETTINGS_CODES.roles],
  company: [...SETTINGS_CODES.company],
  "document-layout": [...SETTINGS_CODES.documentLayout],
};

export const SETTINGS_TABS: TabItem[] = [
  { key: "company", label: "Company Info" },
  { key: "users", label: "Users" },
  { key: "document-layout", label: "Document Layout" },
];

/** The tabs this account may open, in order. Unknown codes (still
 * loading, or Storybook) show everything -- the API still refuses. */
export function settingsTabsFor(codes: string[] | null): TabItem[] {
  return SETTINGS_TABS.filter((tab) =>
    holdsAny(codes, SETTINGS_TAB_REQUIREMENTS[tab.key as SettingsTabKey])
  );
}
