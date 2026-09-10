import { describe, expect, it } from "vitest";
import {
  defaultSettingsModule,
  settingsSubmenuFor,
  settingsTabsForModule,
} from "./settingsModules";
import { settingsTabsFor } from "./settingsTabs";

describe("Settings least privilege", () => {
  it("company + document layout only: General tabs, no Sales module", () => {
    const codes = ["settings.client.edit", "settings.document_layout.edit"];
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "general",
    ]);
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "company",
      "document-layout",
      "language",
    ]);
    expect(settingsTabsForModule("sales", codes)).toEqual([]);
  });

  it("document layout alone: Document Layout tab only", () => {
    const codes = ["settings.document_layout.edit"];
    expect(defaultSettingsModule(codes)).toBe("general");
    expect(settingsTabsFor(codes).map((tab) => tab.key)).toEqual(["document-layout"]);
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "general",
    ]);
  });

  it("company alone: Company + Language, no Document Layout or Sales", () => {
    const codes = ["settings.client.edit"];
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "company",
      "language",
    ]);
    expect(settingsTabsForModule("sales", codes)).toEqual([]);
  });

  it("sales settings alone: Sales module only", () => {
    const codes = ["settings.sales.edit"];
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "sales",
    ]);
    expect(defaultSettingsModule(codes)).toBe("sales");
    expect(settingsTabsForModule("sales", codes).map((tab) => tab.key)).toEqual([
      "sales",
    ]);
  });

  it("roles alone open Users tab without company or sales", () => {
    const codes = ["settings.role.edit"];
    expect(settingsTabsForModule("general", codes).map((tab) => tab.key)).toEqual([
      "users",
    ]);
    expect(settingsTabsForModule("sales", codes)).toEqual([]);
  });
});
