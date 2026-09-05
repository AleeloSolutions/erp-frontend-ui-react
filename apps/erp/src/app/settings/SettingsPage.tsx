import { useState } from "react";

import { AppShell, useNavbarDefaults } from "@/app";

import { Tabs } from "@erp/ui";

import { DocumentLayoutModal } from "./components/DocumentLayoutModal";

import { SettingsTabPanel } from "./components/SettingsTabPanels";

import { settingsTabsFor, type SettingsTabKey } from "./settingsTabs";

import { useSession } from "@/app/session";

import { detailViewTab, type SettingsDetailView } from "./settingsViews";

export type { SettingsTabKey } from "./settingsTabs";

export type { SettingsDetailView } from "./settingsViews";

export interface SettingsPageProps {
  /** Storybook / tests only — production route always opens Users first. */

  defaultTab?: SettingsTabKey;

  defaultDetailView?: SettingsDetailView | null;

  defaultDocumentLayoutOpen?: boolean;
}

export default function SettingsPage({
  defaultTab = "users",

  defaultDetailView = null,

  defaultDocumentLayoutOpen = false,
}: SettingsPageProps) {
  const navbar = useNavbarDefaults({ brandLabel: "Settings" });

  const session = useSession();
  const tabs = settingsTabsFor(session?.permissions ?? null);

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(defaultTab);

  // Land on a tab this account can actually open: the default is Users,
  // which a "Document Layout only" grant has no business seeing.
  const openTab = (
    tabs.some((tab) => tab.key === activeTab) ? activeTab : (tabs[0]?.key ?? activeTab)
  ) as SettingsTabKey;

  const [detailView, setDetailView] = useState<SettingsDetailView | null>(
    defaultDetailView
  );

  const [documentLayoutOpen, setDocumentLayoutOpen] = useState(defaultDocumentLayoutOpen);

  function handleTabChange(key: SettingsTabKey) {
    setActiveTab(key);

    setDetailView(null);

    setDocumentLayoutOpen(false);
  }

  function openDetail(view: SettingsDetailView) {
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
      <Tabs
        align="container"

        items={tabs}

        activeKey={openTab}

        onChange={(key) => handleTabChange(key as SettingsTabKey)}

        aria-label="Settings sections"
      />

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
