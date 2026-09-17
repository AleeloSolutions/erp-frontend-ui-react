import { describe, expect, it } from "vitest";
import {
  SAMPLE_MODULES,
  defaultSettingsModule,
  isSampleModule,
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

describe("Placeholder modules", () => {
  it("sit after the real ones, whatever the account may do", () => {
    const sampleKeys = SAMPLE_MODULES.map((module) => module.key);

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
    expect(SAMPLE_MODULES).toHaveLength(6);
    for (const module of SAMPLE_MODULES) {
      expect(module.label).not.toHaveLength(0);
      // Only that there IS one -- a LucideIcon is a forwardRef object, not
      // a function, and PageSubmenu.test.tsx is where that is pinned.
      expect(module.icon).toBeTruthy();
      expect(isSampleModule(module.key)).toBe(true);
    }
  });

  it("are not mistaken for the real modules", () => {
    expect(isSampleModule("general")).toBe(false);
    expect(isSampleModule("sales")).toBe(false);
  });
});
