import { describe, expect, it } from "vitest";
import { Settings2, ShoppingCart } from "lucide-react";
import { resolveModuleIcon } from "@/app/moduleIcons";
import { moduleRegistry } from "@/modules";
import type { ModuleManifest } from "@/modules/types";
import {
  SAMPLE_MODULES,
  SETTINGS_MODULE_ICON_NAMES,
  defaultSettingsModule,
  isSampleModule,
  settingsAreas,
  settingsHashLanding,
  settingsModuleIcon,
  settingsSubmenuFor,
  settingsTabsForModule,
} from "./settingsModules";
import { settingsTabsFor } from "./settingsTabs";

/**
 * The modules a grant actually opens.
 *
 * The placeholders are appended to every submenu regardless of codes --
 * there is nothing behind them to be permitted to -- so least privilege
 * is asserted against the real ones and the placeholders get their own
 * test below.
 */
function realModules(codes: string[]): string[] {
  return settingsSubmenuFor(() => undefined, codes)
    .map((item) => item.key)
    .filter((key) => !isSampleModule(key));
}

/** The placeholders this build actually offers: one drops out per module
 * whose real settings are compiled in. */
function offeredSamples(): string[] {
  return settingsSubmenuFor(() => undefined, [])
    .map((item) => item.key)
    .filter(isSampleModule);
}

describe("Settings least privilege", () => {
  it("company + document layout: General tabs plus Sales", () => {
    const codes = ["settings.client.edit", "settings.document_layout.edit"];
    expect(realModules(codes)).toEqual(["general", "sales"]);
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "company",
      "document-layout",
      "language",
    ]);
    expect(settingsTabsForModule("sales", codes).map((tab) => tab.key)).toEqual([
      "sales",
      "sales-taxes",
      "sales-payments",
    ]);
  });

  it("document layout alone: Document Layout tab only", () => {
    const codes = ["settings.document_layout.edit"];
    expect(defaultSettingsModule(codes)).toBe("general");
    expect(settingsTabsFor(codes).map((tab) => tab.key)).toEqual(["document-layout"]);
    expect(realModules(codes)).toEqual(["general"]);
  });

  it("company alone: Company + Language, and Sales", () => {
    const codes = ["settings.client.edit"];
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "company",
      "language",
    ]);
    expect(settingsTabsForModule("sales", codes).map((tab) => tab.key)).toEqual([
      "sales",
      "sales-taxes",
      "sales-payments",
    ]);
    expect(realModules(codes)).toEqual(["general", "sales"]);
  });

  it("roles alone open Users tab without company or sales", () => {
    const codes = ["settings.role.edit"];
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "users",
    ]);
    expect(settingsTabsForModule("sales", codes)).toEqual([]);
  });
});

describe("A module's own Settings area", () => {
  const codes = ["settings.client.edit"];

  it("comes from the module's manifest, not from the shell", () => {
    const sales = moduleRegistry.find((module) => module.key === "sales");
    expect(sales?.settings?.tabs.map((tab) => tab.key)).toEqual([
      "sales",
      "sales-taxes",
      "sales-payments",
    ]);
  });

  it("gives each of its tabs a panel to render", () => {
    const area = settingsAreas(codes).find((candidate) => candidate.key === "sales")!;
    expect(area.available).toBe(true);
    for (const tab of area.tabs) {
      expect(area.panels[tab.key]).toBeTruthy();
    }
  });

  it("says coming soon when the workspace has not installed the module", () => {
    // enabled_modules came back without sales: the tenant does not have it.
    const area = settingsAreas(codes, []).find((candidate) => candidate.key === "sales")!;
    expect(area.available).toBe(false);
    expect(area.tabs).toEqual([]);
    expect(area.panels).toEqual({});
  });

  it("is still offered when it has nothing to configure yet", () => {
    // Coming soon is shown to everyone: there is nothing to be permitted to.
    const keys = settingsSubmenuFor(() => undefined, [], []).map((item) => item.key);
    expect(keys).toContain("sales");
  });

  it("falls back to a placeholder in a build that carries no such module", () => {
    // What the SPA looks like between the module's extraction and the
    // merge of its promote PR: no manifest at all.
    const none: ModuleManifest[] = [];
    const keys = settingsSubmenuFor(() => undefined, [], null, none).map(
      (item) => item.key
    );
    expect(keys).toContain("sample:sales");
    expect(keys).not.toContain("sales");

    const area = settingsAreas([], null, none).find(
      (candidate) => candidate.key === "sample:sales"
    )!;
    expect(area.label).toBe("Sales");
    expect(area.available).toBe(false);
  });

  it("deep-links each tab by its own key, read from the registry", () => {
    expect(settingsHashLanding("#sales-taxes")).toEqual({
      module: "sales",
      tab: "sales-taxes",
    });
    expect(settingsHashLanding("#nope")).toBeNull();
    expect(settingsHashLanding("")).toBeNull();
  });
});

describe("Placeholder modules", () => {
  it("sit after the real ones, whatever the account may do", () => {
    const sampleKeys = offeredSamples();
    expect(sampleKeys.length).toBeGreaterThan(0);

    for (const codes of [
      ["settings.document_layout.edit"],
      ["settings.client.edit"],
      [],
    ]) {
      const keys = settingsSubmenuFor(() => undefined, codes).map((item) => item.key);
      expect(keys.slice(-sampleKeys.length)).toEqual(sampleKeys);
    }
  });

  it("each carry a label and an icon for the navbar", () => {
    expect(SAMPLE_MODULES).toHaveLength(7);
    for (const module of SAMPLE_MODULES) {
      expect(module.label).not.toHaveLength(0);
      // Only that there IS one -- a LucideIcon is a forwardRef object, not
      // a function, and PageSubmenu.test.tsx is where that is pinned.
      expect(module.icon).toBeTruthy();
      expect(isSampleModule(module.key)).toBe(true);
    }
  });

  it("step aside for the real module they stand in for", () => {
    // sample:sales is in the list, but this build compiles sales in.
    expect(SAMPLE_MODULES.some((module) => module.moduleKey === "sales")).toBe(true);
    expect(offeredSamples()).not.toContain("sample:sales");
  });

  it("are not mistaken for the real modules", () => {
    expect(isSampleModule("general")).toBe(false);
    expect(isSampleModule("sales")).toBe(false);
  });
});

describe("Settings navbar marks", () => {
  it("resolves the real modules through the shared allowlist", () => {
    expect(settingsModuleIcon("general")).toBe(Settings2);
    // A module's mark comes from its own manifest.
    expect(settingsModuleIcon("sales")).toBe(ShoppingCart);

    for (const [key, name] of Object.entries(SETTINGS_MODULE_ICON_NAMES)) {
      expect(resolveModuleIcon(name)).toBe(settingsModuleIcon(key));
    }
  });

  it("gives every navbar entry -- real or placeholder -- something to render", () => {
    const items = settingsSubmenuFor(() => undefined, ["settings.client.edit"]);
    expect(items.length).toBeGreaterThan(offeredSamples().length);
    for (const item of items) {
      expect(item.icon).toBeTruthy();
    }
  });
});
