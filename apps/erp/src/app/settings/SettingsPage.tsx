import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AppShell, useNavbarDefaults } from "@/app";

import { Tabs } from "@erp/ui";

import { DocumentLayoutModal } from "./components/DocumentLayoutModal";

import { SettingsTabPanel } from "./components/SettingsTabPanels";

import { SettingsComingSoonPanel } from "./components/SettingsComingSoonPanel";

import { useSession } from "@/app/session";

import {
  defaultSettingsModule,
  isSampleModule,
  sampleModule,
  settingsSubmenuFor,
  settingsTabsForModule,
  type SettingsModuleKey,
  type SettingsNavKey,
} from "./settingsModules";

import { type SettingsTabKey } from "./settingsTabs";

import { detailViewTab, type SettingsDetailView } from "./settingsViews";

export type { SettingsTabKey } from "./settingsTabs";

export type { SettingsDetailView } from "./settingsViews";

export type { SettingsModuleKey, SettingsNavKey } from "./settingsModules";

const HASH_TO_TAB: Record<string, SettingsTabKey> = {
  sales: "sales",
  "sales-taxes": "sales-taxes",
  "sales-payments": "sales-payments",
};

function tabFromHash(
  hash: string
): { module: SettingsModuleKey; tab: SettingsTabKey } | null {
  const key = hash.replace(/^#/, "");
  const tab = HASH_TO_TAB[key];
  if (!tab) return null;
  return { module: "sales", tab };
}

export interface SettingsPageProps {
  /** Storybook / tests only — production route always opens Users first. */

  defaultTab?: SettingsTabKey;

  defaultModule?: SettingsNavKey;

  defaultDetailView?: SettingsDetailView | null;

  defaultDocumentLayoutOpen?: boolean;
}

export default function SettingsPage({
  defaultTab = "users",

  defaultModule = "general",

  defaultDetailView = null,

  defaultDocumentLayoutOpen = false,
}: SettingsPageProps) {
  const session = useSession();
  const permissions = session?.permissions ?? null;
  const [searchParams] = useSearchParams();

  const hashLanding =
    typeof window !== "undefined" ? tabFromHash(window.location.hash) : null;
  const queryModule = searchParams.get("module") as SettingsModuleKey | null;
  const queryTab = searchParams.get("tab") as SettingsTabKey | null;

  const [activeModule, setActiveModule] = useState<SettingsNavKey>(
    hashLanding?.module ??
      (queryModule === "sales" || queryModule === "general" ? queryModule : defaultModule)
  );
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(
    hashLanding?.tab ?? queryTab ?? defaultTab
  );
  const [detailView, setDetailView] = useState<SettingsDetailView | null>(
    defaultDetailView
  );
  const [documentLayoutOpen, setDocumentLayoutOpen] = useState(defaultDocumentLayoutOpen);

  useEffect(() => {
    function syncFromHash() {
      const landed = tabFromHash(window.location.hash);
      if (!landed) return;
      setActiveModule(landed.module);
      setActiveTab(landed.tab);
      setDetailView(null);
      setDocumentLayoutOpen(false);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function handleTabChange(key: SettingsTabKey) {
    setActiveTab(key);
    setDetailView(null);
    setDocumentLayoutOpen(false);
    if (activeModule === "sales") {
      const hash = Object.entries(HASH_TO_TAB).find(([, tab]) => tab === key)?.[0];
      if (hash) window.history.replaceState(null, "", `#${hash}`);
    }
  }

  // A placeholder module has no tabs and no settings -- it owns the body
  // on its own, so the real-module resolution below is skipped entirely.
  const placeholder = isSampleModule(activeModule)
    ? sampleModule(activeModule)
    : undefined;

  const openModule = (
    placeholder
      ? activeModule
      : settingsTabsForModule(activeModule as SettingsModuleKey, permissions).length > 0
        ? activeModule
        : defaultSettingsModule(permissions)
  ) as SettingsNavKey;

  const tabs = placeholder
    ? []
    : settingsTabsForModule(openModule as SettingsModuleKey, permissions);

  // Land on a tab this account can actually open: the default is Users,
  // which a "Document Layout only" grant has no business seeing.
  const openTab = (
    tabs.some((tab) => tab.key === activeTab) ? activeTab : (tabs[0]?.key ?? activeTab)
  ) as SettingsTabKey;

  const navbar = useNavbarDefaults({
    brandLabel: "Settings",
    submenuTone: "quiet",
    submenuItems: settingsSubmenuFor((key) => {
      setActiveModule(key);
      setDetailView(null);
      setDocumentLayoutOpen(false);
      if (isSampleModule(key)) {
        if (window.location.hash.startsWith("#sales")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }
      const nextTabs = settingsTabsForModule(key, permissions);
      if (nextTabs[0]) {
        setActiveTab(nextTabs[0].key as SettingsTabKey);
        if (key === "sales") {
          window.history.replaceState(null, "", "#sales");
        } else if (window.location.hash.startsWith("#sales")) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }, permissions),
    submenuActiveKey: openModule,
  });

  function openDetail(view: SettingsDetailView) {
    setActiveModule("general");
    setActiveTab(detailViewTab(view));
    setDetailView(view);
  }

  function handleBack() {
    setDetailView(null);
  }

  function openDocumentLayout() {
    setDocumentLayoutOpen(true);
  }

  function closeDocumentLayout() {
    setDocumentLayoutOpen(false);
  }

  return (
    <AppShell activeNavKey="settings" activeMobileKey="more" navbar={navbar}>
      {placeholder ? (
        <SettingsComingSoonPanel module={placeholder} />
      ) : (
        <>
          {tabs.length > 0 ? (
            <Tabs
              align="container"
              items={tabs}
              activeKey={openTab}
              onChange={(key) => handleTabChange(key as SettingsTabKey)}
              aria-label={`${openModule} settings sections`}
            />
          ) : null}

          <SettingsTabPanel
            activeTab={openTab}
            detailView={detailView}
            onOpenDetail={openDetail}
            onOpenDocumentLayout={openDocumentLayout}
            onBack={handleBack}
          />

          <DocumentLayoutModal open={documentLayoutOpen} onClose={closeDocumentLayout} />
        </>
      )}
    </AppShell>
  );
}
