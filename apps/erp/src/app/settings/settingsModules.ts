import type { SubmenuItem, TabItem } from "@erp/ui";
import { holdsAny } from "@/app/access";
import { SETTINGS_TAB_REQUIREMENTS, type SettingsTabKey } from "./settingsTabs";

/** Top-level Settings areas shown in the Navbar. */
export type SettingsModuleKey = "general" | "sales";

export const SETTINGS_MODULE_ORDER: SettingsModuleKey[] = ["general", "sales"];

export const SETTINGS_MODULE_LABELS: Record<SettingsModuleKey, string> = {
  general: "General",
  sales: "Sales",
};

/** Sub-tabs offered inside each Settings module. */
export const SETTINGS_MODULE_TABS: Record<SettingsModuleKey, SettingsTabKey[]> = {
  general: ["company", "users", "document-layout", "language", "modules"],
  sales: ["sales"],
};

const STUB_TAB_LABELS: Partial<Record<SettingsTabKey, string>> = {
  language: "Language",
  sales: "Sales settings",
};

const GENERAL_TAB_LABELS: Partial<Record<SettingsTabKey, string>> = {
  company: "Company Info",
  users: "Users",
  modules: "Modules",
  "document-layout": "Document Layout",
  language: "Language",
};

/** Static Navbar items (form pages / deep links back to Settings). */
export const settingsSubmenu: SubmenuItem[] = SETTINGS_MODULE_ORDER.map((key) => ({
  key,
  label: SETTINGS_MODULE_LABELS[key],
  href: "/settings",
}));

export const settingsNavbar = {
  brandLabel: "Settings",
  submenuItems: settingsSubmenu,
};

/** Navbar items that switch modules — only modules with visible tabs. */
export function settingsSubmenuFor(
  onSelect: (key: SettingsModuleKey) => void,
  codes: string[] | null = null
): SubmenuItem[] {
  return SETTINGS_MODULE_ORDER.filter(
    (key) => settingsTabsForModule(key, codes).length > 0
  ).map((key) => ({
    key,
    label: SETTINGS_MODULE_LABELS[key],
    href: "/settings",
    onClick: () => onSelect(key),
  }));
}

function tabLabel(key: SettingsTabKey): string {
  return GENERAL_TAB_LABELS[key] ?? STUB_TAB_LABELS[key] ?? key;
}

/** Permission-filtered Tabs for the active Settings module. */
export function settingsTabsForModule(
  module: SettingsModuleKey,
  codes: string[] | null
): TabItem[] {
  return SETTINGS_MODULE_TABS[module]
    .filter((key) => holdsAny(codes, SETTINGS_TAB_REQUIREMENTS[key]))
    .map((key) => ({ key, label: tabLabel(key) }));
}

/** First module that still has at least one visible tab for this account. */
export function defaultSettingsModule(codes: string[] | null): SettingsModuleKey {
  for (const module of SETTINGS_MODULE_ORDER) {
    if (settingsTabsForModule(module, codes).length > 0) return module;
  }
  return "general";
}
