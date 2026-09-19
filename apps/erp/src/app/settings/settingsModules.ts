/**
 * What the Settings navbar offers, and what sits behind each entry.
 *
 * Three kinds of entry, resolved in this order:
 *
 *  1. **General** — the platform's own screens. The shell owns these, and
 *     their panels come from `SettingsTabPanels`, because they share the
 *     page's state (detail views, the document-layout modal).
 *  2. **A module's area** — contributed by its manifest (`ModuleManifest
 *     .settings`), so the settings of a module ship inside the module and
 *     travel in its package. The shell renders the tab's own `Panel` and
 *     knows nothing else about it. A module the tenant has not installed
 *     still gets an entry, and it says "Coming soon".
 *  3. **A placeholder** — a module this build carries no settings for at
 *     all, listed so the roadmap is visible. Also "Coming soon".
 *
 * Sales was case 1 until 2026-09-19 and is case 2 now. In a build made
 * between its extraction and its promote it is case 3, which is the whole
 * point of keeping case 3 around.
 */

import type { ComponentType } from "react";
import {
  Banknote,
  Calculator,
  Package,
  Scan,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SubmenuItem, TabItem } from "@erp/ui";
import { holdsAny, isModuleEnabled } from "@/app/access";
import { resolveModuleIcon, type ModuleIconName } from "@/app/moduleIcons";
import { moduleRegistry } from "@/modules";
import type { ModuleManifest } from "@/modules/types";
import { SETTINGS_TAB_REQUIREMENTS, type SettingsTabKey } from "./settingsTabs";

/** The area the application shell owns. Everything else is a module. */
export const GENERAL_MODULE = "general";

/** A real Settings area: `general`, or a module key. */
export type SettingsModuleKey = string;

/** A placeholder area — see SAMPLE_MODULES. */
export type SampleModuleKey = `sample:${string}`;

/** Anything the Settings navbar can be pointed at. */
export type SettingsNavKey = SettingsModuleKey | SampleModuleKey;

export const SETTINGS_MODULE_ORDER: SettingsModuleKey[] = [GENERAL_MODULE];

export const SETTINGS_MODULE_LABELS: Record<string, string> = {
  general: "General",
};

/**
 * The mark General shows in the navbar, held as a NAME on the shared
 * allowlist (`@/app/moduleIcons`) rather than as a component, so it goes
 * through the same resolver as a module's backend-supplied `icon`: one
 * fallback path, one place that decides what an unknown name degrades to.
 *
 * A module's mark comes from its own manifest instead, which is already
 * a resolved component. When logos arrive they become the rung ABOVE
 * this one, so the icon slot does not have to change either.
 */
export const SETTINGS_MODULE_ICON_NAMES: Record<string, ModuleIconName> = {
  general: "Settings2",
};

/** Sub-tabs offered inside General. A module brings its own. */
export const SETTINGS_MODULE_TABS: Record<string, SettingsTabKey[]> = {
  general: ["company", "users", "document-layout", "language", "modules"],
};

const GENERAL_TAB_LABELS: Partial<Record<SettingsTabKey, string>> = {
  company: "Company Info",
  users: "Users",
  modules: "Modules",
  "document-layout": "Document Layout",
  language: "Language",
};

/**
 * Modules this build carries no settings for.
 *
 * Two sorts end up here and they behave the same way: modules that do
 * not exist yet, and modules that exist but whose frontend has not landed
 * in this build (`moduleKey` names the one it stands in for, and a real
 * manifest with that key replaces it). Selecting either lands on "Coming
 * soon", which is the whole of what they do.
 *
 * Four match prefixes the backend's AGENTS.md §1 already reserves
 * (`al_acc_`, `al_pur_`, `al_hr_`, `al_pay_`), so the list is the roadmap
 * rather than filler.
 */
export interface SampleModule {
  key: SampleModuleKey;
  /**
   * The real module key this stands in for, when one exists. Present
   * means "the module is real, its UI is just not in this build".
   */
  moduleKey?: string;
  label: string;
  /**
   * Carried as a component, not a name: a placeholder answers to nobody
   * on the wire, so there is no contract to resolve against. Real
   * modules go through their manifest.
   */
  icon: LucideIcon;
}

export const SAMPLE_MODULES: SampleModule[] = [
  { key: "sample:sales", moduleKey: "sales", label: "Sales", icon: ShoppingCart },
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

/**
 * One entry of the Settings navbar, with everything the page needs to
 * render it: its tabs (already permission-filtered) and the panel behind
 * each. `available: false` means the entry shows "Coming soon".
 */
export interface SettingsArea {
  key: SettingsNavKey;
  label: string;
  icon: LucideIcon;
  tabs: TabItem[];
  /** Tab key -> panel, for a module's area. Empty for General. */
  panels: Record<string, ComponentType>;
  available: boolean;
}

function generalArea(codes: string[] | null): SettingsArea {
  return {
    key: GENERAL_MODULE,
    label: SETTINGS_MODULE_LABELS.general,
    icon: resolveModuleIcon(SETTINGS_MODULE_ICON_NAMES.general),
    tabs: SETTINGS_MODULE_TABS.general
      .filter((key) => holdsAny(codes, SETTINGS_TAB_REQUIREMENTS[key]))
      .map((key) => ({ key, label: GENERAL_TAB_LABELS[key] ?? key })),
    panels: {},
    available: true,
  };
}

function moduleArea(
  module: ModuleManifest,
  codes: string[] | null,
  enabled: boolean
): SettingsArea | null {
  const settings = module.settings;
  if (!settings) return null;
  const visible = settings.tabs.filter((tab) => holdsAny(codes, tab.requires ?? []));
  return {
    key: module.key,
    label: settings.label ?? module.label,
    icon: module.icon,
    // Nothing is configurable until the module is installed, so an area
    // that is not available carries no tabs whatever the codes say.
    tabs: enabled ? visible.map((tab) => ({ key: tab.key, label: tab.label })) : [],
    panels: enabled ? Object.fromEntries(visible.map((tab) => [tab.key, tab.Panel])) : {},
    available: enabled,
  };
}

function placeholderArea(module: SampleModule): SettingsArea {
  return {
    key: module.key,
    label: module.label,
    icon: module.icon,
    tabs: [],
    panels: {},
    available: false,
  };
}

/**
 * Every Settings area, in navbar order: General, then each module that
 * contributes one, then the placeholders for modules this build has no
 * settings for.
 *
 * `enabledKeys` is `me.enabled_modules`; null (still loading, or
 * Storybook) counts as installed, the same way `holdsAny` treats unknown
 * codes — the API still refuses what it must.
 */
export function settingsAreas(
  codes: string[] | null = null,
  enabledKeys: readonly string[] | null = null,
  modules: readonly ModuleManifest[] = moduleRegistry
): SettingsArea[] {
  const contributed = modules.filter((module) => module.settings);
  const session = enabledKeys === null ? null : { enabled_modules: [...enabledKeys] };

  const areas: SettingsArea[] = [generalArea(codes)];
  for (const module of contributed) {
    const area = moduleArea(module, codes, isModuleEnabled(session, module.key));
    if (area) areas.push(area);
  }

  const covered = new Set(contributed.map((module) => module.key));
  for (const sample of SAMPLE_MODULES) {
    if (sample.moduleKey && covered.has(sample.moduleKey)) continue;
    areas.push(placeholderArea(sample));
  }
  return areas;
}

/** The area behind a navbar key, or undefined when nothing answers to it. */
export function settingsAreaFor(
  key: SettingsNavKey,
  codes: string[] | null = null,
  enabledKeys: readonly string[] | null = null,
  modules: readonly ModuleManifest[] = moduleRegistry
): SettingsArea | undefined {
  return settingsAreas(codes, enabledKeys, modules).find((area) => area.key === key);
}

/** The navbar mark for an area. */
export function settingsModuleIcon(key: SettingsNavKey): LucideIcon {
  const name = SETTINGS_MODULE_ICON_NAMES[key];
  if (name) return resolveModuleIcon(name);
  return settingsAreaFor(key)?.icon ?? resolveModuleIcon(undefined);
}

/** Static Navbar items (form pages / deep links back to Settings). */
export const settingsSubmenu: SubmenuItem[] = SETTINGS_MODULE_ORDER.map((key) => ({
  key,
  label: SETTINGS_MODULE_LABELS[key],
  icon: settingsModuleIcon(key),
  href: "/settings",
}));

export const settingsNavbar = {
  brandLabel: "Settings",
  submenuItems: settingsSubmenu,
};

/**
 * Navbar items that switch areas.
 *
 * An area with something to configure is offered only when this account
 * may open at least one of its tabs. An area that says "Coming soon" is
 * offered to everyone, because there is nothing behind it to be
 * permitted to.
 */
export function settingsSubmenuFor(
  onSelect: (key: SettingsNavKey) => void,
  codes: string[] | null = null,
  enabledKeys: readonly string[] | null = null,
  modules: readonly ModuleManifest[] = moduleRegistry
): SubmenuItem[] {
  return settingsAreas(codes, enabledKeys, modules)
    .filter((area) => !area.available || area.tabs.length > 0)
    .map((area) => ({
      key: area.key,
      label: area.label,
      icon: area.icon,
      href: "/settings",
      onClick: () => onSelect(area.key),
    }));
}

/** Permission-filtered Tabs for one area. */
export function settingsTabsForModule(
  module: SettingsNavKey,
  codes: string[] | null,
  enabledKeys: readonly string[] | null = null,
  modules: readonly ModuleManifest[] = moduleRegistry
): TabItem[] {
  return settingsAreaFor(module, codes, enabledKeys, modules)?.tabs ?? [];
}

/** First area that still has at least one visible tab for this account. */
export function defaultSettingsModule(
  codes: string[] | null,
  enabledKeys: readonly string[] | null = null,
  modules: readonly ModuleManifest[] = moduleRegistry
): SettingsModuleKey {
  const area = settingsAreas(codes, enabledKeys, modules).find(
    (candidate) => candidate.available && candidate.tabs.length > 0
  );
  return area?.key ?? GENERAL_MODULE;
}

/**
 * The area and tab a `#hash` lands on, or null.
 *
 * A module's tab key is its hash, so this is built from the registry
 * rather than from a list the shell keeps: a module that ships a new tab
 * gets a deep link to it without the shell being told.
 */
export function settingsHashLanding(
  hash: string,
  modules: readonly ModuleManifest[] = moduleRegistry
): { module: SettingsNavKey; tab: string } | null {
  const key = hash.replace(/^#/, "");
  if (!key) return null;
  for (const module of modules) {
    for (const tab of module.settings?.tabs ?? []) {
      if (tab.key === key) return { module: module.key, tab: tab.key };
    }
  }
  return null;
}

/** The `#hash` that deep-links to a tab of a module's area, if any. */
export function settingsHashFor(
  moduleKey: SettingsNavKey,
  tab: string,
  modules: readonly ModuleManifest[] = moduleRegistry
): string | null {
  const module = modules.find((candidate) => candidate.key === moduleKey);
  const found = module?.settings?.tabs.some((candidate) => candidate.key === tab);
  return found ? `#${tab}` : null;
}
