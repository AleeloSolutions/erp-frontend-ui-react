import type { TabItem } from "@erp/ui";

export type SettingsTabKey = "users" | "company" | "document-layout";

export const SETTINGS_TABS: TabItem[] = [
  { key: "users", label: "Users" },
  { key: "company", label: "Company Info" },
  { key: "document-layout", label: "Document Layout" },
];
