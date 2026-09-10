import { useState } from "react";

import { AppShell, useNavbarDefaults } from "@/app";

import { Tabs } from "@erp/ui";

import { DocumentLayoutModal } from "./components/DocumentLayoutModal";

import { SettingsTabPanel } from "./components/SettingsTabPanels";

import { useSession } from "@/app/session";

import {
  defaultSettingsModule,
  settingsSubmenuFor,
  settingsTabsForModule,
  type SettingsModuleKey,
} from "./settingsModules";

import { type SettingsTabKey } from "./settingsTabs";

import { detailViewTab, type SettingsDetailView } from "./settingsViews";

export type { SettingsTabKey } from "./settingsTabs";

export type { SettingsDetailView } from "./settingsViews";

export type { SettingsModuleKey } from "./settingsModules";

export interface SettingsPageProps {
  /** Storybook / tests only — production route always opens Users first. */

  defaultTab?: SettingsTabKey;

  defaultModule?: SettingsModuleKey;

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

  const [activeModule, setActiveModule] = useState<SettingsModuleKey>(defaultModule);
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(defaultTab);
  const [detailView, setDetailView] = useState<SettingsDetailView | null>(
    defaultDetailView
  );
  const [documentLayoutOpen, setDocumentLayoutOpen] = useState(defaultDocumentLayoutOpen);

  const openModule = (
    settingsTabsForModule(activeModule, permissions).length > 0
      ? activeModule
      : defaultSettingsModule(permissions)
  ) as SettingsModuleKey;

  const tabs = settingsTabsForModule(openModule, permissions);

  // Land on a tab this account can actually open: the default is Users,
  // which a "Document Layout only" grant has no business seeing.
  const openTab = (
    tabs.some((tab) => tab.key === activeTab) ? activeTab : (tabs[0]?.key ?? activeTab)
  ) as SettingsTabKey;

  const navbar = useNavbarDefaults({
    brandLabel: "Settings",
    submenuItems: settingsSubmenuFor((key) => {
      setActiveModule(key);
      setDetailView(null);
      setDocumentLayoutOpen(false);
      const nextTabs = settingsTabsForModule(key, permissions);
      if (nextTabs[0]) setActiveTab(nextTabs[0].key as SettingsTabKey);
    }),
    submenuActiveKey: openModule,
  });

  function handleTabChange(key: SettingsTabKey) {
    setActiveTab(key);
    setDetailView(null);
    setDocumentLayoutOpen(false);
  }

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
    </AppShell>
  );
}
