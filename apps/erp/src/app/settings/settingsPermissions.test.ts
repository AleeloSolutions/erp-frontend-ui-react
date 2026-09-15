import { describe, expect, it } from "vitest";
import {
  defaultSettingsModule,
  settingsSubmenuFor,
  settingsTabsForModule,
} from "./settingsModules";
import { settingsTabsFor } from "./settingsTabs";

describe("Settings least privilege", () => {
  it("company + document layout: General tabs plus Sales", () => {
    const codes = ["settings.client.edit", "settings.document_layout.edit"];
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "general",
      "sales",
    ]);
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
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "general",
    ]);
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
    expect(settingsSubmenuFor(() => undefined, codes).map((item) => item.key)).toEqual([
      "general",
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
