import type { TabItem } from "@erp/ui";
import { holdsAny } from "@/app/access";

export type SettingsTabKey = "users" | "company" | "document-layout";

/** The code each tab needs. A tab nobody can act on is not offered --
 * seeing the workspace's people or company details is not something a
 * "Document Layout only" grant should include. */
export const SETTINGS_TAB_REQUIREMENTS: Record<SettingsTabKey, string[]> = {
  users: ["settings.user.manage", "settings.role.manage"],
  company: ["settings.client.update"],
  "document-layout": ["settings.document_layout.update"],
};

export const SETTINGS_TABS: TabItem[] = [
  { key: "users", label: "Users" },
  { key: "company", label: "Company Info" },
  { key: "document-layout", label: "Document Layout" },
];

/** The tabs this account may open, in order. Unknown codes (still
 * loading, or Storybook) show everything -- the API still refuses. */
export function settingsTabsFor(codes: string[] | null): TabItem[] {
  return SETTINGS_TABS.filter((tab) =>
    holdsAny(codes, SETTINGS_TAB_REQUIREMENTS[tab.key as SettingsTabKey])
  );
}
