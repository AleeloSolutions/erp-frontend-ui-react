import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AppShell, useNavbarDefaults } from "@/app";

import { Tabs } from "@erp/ui";

import { DocumentLayoutModal } from "./components/DocumentLayoutModal";

import { SettingsTabPanel } from "./components/SettingsTabPanels";

import { SettingsComingSoonPanel } from "./components/SettingsComingSoonPanel";

import { useSession } from "@/app/session";

import {
  GENERAL_MODULE,
  defaultSettingsModule,
  settingsAreas,
  settingsHashFor,
  settingsHashLanding,
  settingsSubmenuFor,
  type SettingsArea,
  type SettingsNavKey,
} from "./settingsModules";

import { type SettingsTabKey } from "./settingsTabs";

import { detailViewTab, type SettingsDetailView } from "./settingsViews";

export type { SettingsTabKey } from "./settingsTabs";

export type { SettingsDetailView } from "./settingsViews";

export type { SettingsModuleKey, SettingsNavKey } from "./settingsModules";

export interface SettingsPageProps {
  /** Storybook / tests only — production route always opens Users first. */

  defaultTab?: SettingsTabKey | string;

  defaultModule?: SettingsNavKey;

  defaultDetailView?: SettingsDetailView | null;

  defaultDocumentLayoutOpen?: boolean;
}

export default function SettingsPage({
  defaultTab = "users",

  defaultModule = GENERAL_MODULE,

  defaultDetailView = null,

  defaultDocumentLayoutOpen = false,
}: SettingsPageProps) {
  const session = useSession();
  const permissions = session?.permissions ?? null;
  const enabledModules = session?.enabled_modules ?? null;
  const [searchParams] = useSearchParams();

  // Every area the navbar can offer, with its tabs already filtered by
  // what this account holds. A module's area comes from its manifest, so
  // nothing here is per-module.
  const areas = useMemo(
    () => settingsAreas(permissions, enabledModules),
    [permissions, enabledModules]
  );

  const hashLanding =
    typeof window !== "undefined" ? settingsHashLanding(window.location.hash) : null;
  const queryModule = searchParams.get("module");
  const queryTab = searchParams.get("tab");

  const [activeModule, setActiveModule] = useState<SettingsNavKey>(
    hashLanding?.module ??
      (queryModule && areas.some((area) => area.key === queryModule)
        ? queryModule
        : defaultModule)
  );
  const [activeTab, setActiveTab] = useState<string>(
    hashLanding?.tab ?? queryTab ?? defaultTab
  );
  const [detailView, setDetailView] = useState<SettingsDetailView | null>(
    defaultDetailView
  );
  const [documentLayoutOpen, setDocumentLayoutOpen] = useState(defaultDocumentLayoutOpen);

  useEffect(() => {
    function syncFromHash() {
      const landed = settingsHashLanding(window.location.hash);
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

  // An area with no tabs owns the body on its own: either it is a module
  // this workspace has not installed, or a placeholder. Both say "Coming
  // soon", so neither resolves a tab.
  const selected: SettingsArea | undefined = areas.find(
    (area) => area.key === activeModule
  );
  const openArea: SettingsArea =
    selected && (!selected.available || selected.tabs.length > 0)
      ? selected
      : (areas.find(
          (area) => area.key === defaultSettingsModule(permissions, enabledModules)
        ) ?? areas[0]);

  const comingSoon = !openArea.available;
  const tabs = openArea.tabs;

  // Land on a tab this account can actually open: the default is Users,
  // which a "Document Layout only" grant has no business seeing.
  const openTab = tabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : (tabs[0]?.key ?? activeTab);

  function handleTabChange(key: string) {
    setActiveTab(key);
    setDetailView(null);
    setDocumentLayoutOpen(false);
    const hash = settingsHashFor(openArea.key, key);
    if (hash) window.history.replaceState(null, "", hash);
  }

  function clearModuleHash() {
    if (settingsHashLanding(window.location.hash)) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  const navbar = useNavbarDefaults({
    brandLabel: "Settings",
    submenuTone: "quiet",
    submenuItems: settingsSubmenuFor(
      (key) => {
        setActiveModule(key);
        setDetailView(null);
        setDocumentLayoutOpen(false);
        const next = areas.find((area) => area.key === key);
        const firstTab = next?.tabs[0]?.key;
        if (!firstTab) {
          clearModuleHash();
          return;
        }
        setActiveTab(firstTab);
        const hash = settingsHashFor(key, firstTab);
        if (hash) {
          window.history.replaceState(null, "", hash);
        } else {
          clearModuleHash();
        }
      },
      permissions,
      enabledModules
    ),
    submenuActiveKey: openArea.key,
  });

  function openDetail(view: SettingsDetailView) {
    setActiveModule(GENERAL_MODULE);
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

  // A module's tab renders its own panel; General's come from the shell,
  // because they share this page's state.
  const ModulePanel = openArea.panels[openTab];

  return (
    <AppShell activeNavKey="settings" activeMobileKey="more" navbar={navbar}>
      {comingSoon ? (
        <SettingsComingSoonPanel module={openArea} />
      ) : (
        <>
          {tabs.length > 0 ? (
            <Tabs
              align="container"
              items={tabs}
              activeKey={openTab}
              onChange={(key) => handleTabChange(key as string)}
              aria-label={`${openArea.key} settings sections`}
            />
          ) : null}

          {ModulePanel ? (
            <Suspense
              fallback={
                <div
                  className="grid min-h-[22rem] place-items-center rounded-sm border border-erp-border-soft bg-white"
                  role="tabpanel"
                  aria-busy="true"
                >
                  <p className="m-0 text-[12px] text-erp-muted">
                    Loading {openArea.label}…
                  </p>
                </div>
              }
            >
              <ModulePanel />
            </Suspense>
          ) : (
            <SettingsTabPanel
              activeTab={openTab as SettingsTabKey}
              detailView={detailView}
              onOpenDetail={openDetail}
              onOpenDocumentLayout={openDocumentLayout}
              onBack={handleBack}
            />
          )}

          <DocumentLayoutModal open={documentLayoutOpen} onClose={closeDocumentLayout} />
        </>
      )}
    </AppShell>
  );
}
