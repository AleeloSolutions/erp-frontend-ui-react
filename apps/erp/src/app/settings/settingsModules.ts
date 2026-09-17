import {
  Banknote,
  Calculator,
  Package,
  Scan,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SubmenuItem, TabItem } from "@erp/ui";
import { holdsAny } from "@/app/access";
import { SETTINGS_TAB_REQUIREMENTS, type SettingsTabKey } from "./settingsTabs";

/** Top-level Settings areas shown in the Navbar. */
export type SettingsModuleKey = "general" | "sales";

/** A placeholder module — see SAMPLE_MODULES. */
export type SampleModuleKey = `sample:${string}`;

/** Anything the Settings navbar can be pointed at. */
export type SettingsNavKey = SettingsModuleKey | SampleModuleKey;

export const SETTINGS_MODULE_ORDER: SettingsModuleKey[] = ["general", "sales"];

export const SETTINGS_MODULE_LABELS: Record<SettingsModuleKey, string> = {
  general: "General",
  sales: "Sales",
};

/**
 * The mark each module shows in the navbar.
 *
 * Lucide stands in until a module has artwork. When logos arrive these
 * become the last rung of the fallback — package logo, then descriptor
 * logo, then this — so the icon slot itself never has to change.
 */
export const SETTINGS_MODULE_ICONS: Record<SettingsModuleKey, LucideIcon> = {
  general: Settings2,
  sales: ShoppingCart,
};

/**
 * Modules that do not exist yet.
 *
 * They are here to answer one question — what does the Settings navbar
 * look like carrying a real module list rather than two entries — and
 * they behave honestly: selecting one lands on "Coming soon", which is
 * the whole of what they do. Nothing else in the app knows about them.
 *
 * Four match prefixes AGENTS.md §1 already reserves (`al_acc_`, `al_pur_`,
 * `al_hr_`, `al_pay_`), so the list is the roadmap rather than filler.
 *
 * Delete this block, and SAMPLE_MODULES' one use in settingsSubmenuFor,
 * once the real modules land.
 */
export interface SampleModule {
  key: SampleModuleKey;
  label: string;
  icon: LucideIcon;
}

export const SAMPLE_MODULES: SampleModule[] = [
  { key: "sample:accounting", label: "Accounting", icon: Calculator },
  { key: "sample:purchasing", label: "Purchasing", icon: Truck },
  { key: "sample:inventory", label: "Inventory", icon: Package },
  { key: "sample:hr", label: "HR", icon: Users },
  { key: "sample:payroll", label: "Payroll", icon: Banknote },
  { key: "sample:pos", label: "Point of Sale", icon: Scan },
];

export function isSampleModule(key: string): key is SampleModuleKey {
  return key.startsWith("sample:");
}

export function sampleModule(key: string): SampleModule | undefined {
  return SAMPLE_MODULES.find((module) => module.key === key);
}

/** Sub-tabs offered inside each Settings module. */
export const SETTINGS_MODULE_TABS: Record<SettingsModuleKey, SettingsTabKey[]> = {
  general: ["company", "users", "document-layout", "language", "modules"],
  sales: ["sales", "sales-taxes", "sales-payments"],
};

const STUB_TAB_LABELS: Partial<Record<SettingsTabKey, string>> = {
  language: "Language",
  sales: "Sale Defaults",
  "sales-taxes": "Taxes",
  "sales-payments": "Payment Methods",
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
  icon: SETTINGS_MODULE_ICONS[key],
  href: "/settings",
}));

export const settingsNavbar = {
  brandLabel: "Settings",
  submenuItems: settingsSubmenu,
};

/**
 * Navbar items that switch modules — only modules with visible tabs,
 * then the placeholders, which everyone sees because there is nothing
 * behind them to be permitted to.
 */
export function settingsSubmenuFor(
  onSelect: (key: SettingsNavKey) => void,
  codes: string[] | null = null
): SubmenuItem[] {
  const real: SubmenuItem[] = SETTINGS_MODULE_ORDER.filter(
    (key) => settingsTabsForModule(key, codes).length > 0
  ).map((key) => ({
    key,
    label: SETTINGS_MODULE_LABELS[key],
    icon: SETTINGS_MODULE_ICONS[key],
    href: "/settings",
    onClick: () => onSelect(key),
  }));

  const samples: SubmenuItem[] = SAMPLE_MODULES.map((module) => ({
    key: module.key,
    label: module.label,
    icon: module.icon,
    href: "/settings",
    onClick: () => onSelect(module.key),
  }));

  return [...real, ...samples];
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
