import { describe, expect, it } from "vitest";
import { Settings2, ShoppingCart } from "lucide-react";
import { resolveModuleIcon } from "@/app/moduleIcons";
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
 * A module that contributes a Settings area, declared here rather than
 * taken from the live registry.
 *
 * These are the shell's rules, not one module's: reading the real
 * registry made them pass or fail on which modules a build happens to
 * carry. That the real Sales manifest contributes its three tabs is the
 * module's own test, and it ships with the module.
 */
const panel = (name: string) => {
  const Panel = () => null;
  Panel.displayName = name;
  return Panel;
};

const SALES: ModuleManifest = {
  key: "sales",
  navArea: "sales",
  id: "sales",
  label: "Sales",
  version: "1.0.0",
  icon: ShoppingCart,
  path: "/sales",
  nav: { key: "sales", label: "Sales", href: "/sales" },
  Routes: () => null,
  settings: {
    label: "Sales",
    tabs: [
      {
        key: "sales",
        label: "Sale Defaults",
        requires: ["settings.client.edit"],
        Panel: panel("SaleDefaults"),
      },
      {
        key: "sales-taxes",
        label: "Taxes",
        requires: ["settings.client.edit"],
        Panel: panel("Taxes"),
      },
      {
        key: "sales-payments",
        label: "Payment Methods",
        requires: ["settings.client.edit"],
        Panel: panel("PaymentMethods"),
      },
    ],
  },
};

const MODULES: ModuleManifest[] = [SALES];

/** The areas a grant actually opens, placeholders excluded: they are
 * appended whatever the codes say, and get their own tests below. */
function realModules(codes: string[]): string[] {
  return settingsSubmenuFor(() => undefined, codes, null, MODULES)
    .map((item) => item.key)
    .filter((key) => !isSampleModule(key));
}

function samplesOffered(modules: ModuleManifest[] = MODULES): string[] {
  return settingsSubmenuFor(() => undefined, [], null, modules)
    .map((item) => item.key)
    .filter(isSampleModule);
}

function tabs(module: string, codes: string[]): string[] {
  return settingsTabsForModule(module, codes, null, MODULES).map((tab) => tab.key);
}

describe("Settings least privilege", () => {
  it("company + document layout: General tabs plus Sales", () => {
    const codes = ["settings.client.edit", "settings.document_layout.edit"];
    expect(realModules(codes)).toEqual(["general", "sales"]);
    expect(tabs("general", codes)).toEqual(["company", "document-layout", "language"]);
    expect(tabs("sales", codes)).toEqual(["sales", "sales-taxes", "sales-payments"]);
  });

  it("document layout alone: Document Layout tab only", () => {
    const codes = ["settings.document_layout.edit"];
    expect(defaultSettingsModule(codes, null, MODULES)).toBe("general");
    expect(settingsTabsFor(codes).map((tab) => tab.key)).toEqual(["document-layout"]);
    expect(realModules(codes)).toEqual(["general"]);
  });

  it("company alone: Company + Language, and Sales", () => {
    const codes = ["settings.client.edit"];
    expect(tabs("general", codes)).toEqual(["company", "language"]);
    expect(tabs("sales", codes)).toEqual(["sales", "sales-taxes", "sales-payments"]);
    expect(realModules(codes)).toEqual(["general", "sales"]);
  });

  it("roles alone open Users tab without company or sales", () => {
    const codes = ["settings.role.edit"];
    expect(tabs("general", codes)).toEqual(["users"]);
    expect(tabs("sales", codes)).toEqual([]);
  });
});

describe("A module's own Settings area", () => {
  const codes = ["settings.client.edit"];

  it("gives each of its tabs a panel to render", () => {
    const area = settingsAreas(codes, null, MODULES).find(
      (candidate) => candidate.key === "sales"
    )!;
    expect(area.available).toBe(true);
    expect(area.label).toBe("Sales");
    expect(area.icon).toBe(ShoppingCart);
    for (const tab of area.tabs) {
      expect(area.panels[tab.key]).toBeTruthy();
    }
  });

  it("says coming soon when the workspace has not installed the module", () => {
    // enabled_modules came back without sales: the tenant does not have it.
    const area = settingsAreas(codes, [], MODULES).find(
      (candidate) => candidate.key === "sales"
    )!;
    expect(area.available).toBe(false);
    expect(area.tabs).toEqual([]);
    expect(area.panels).toEqual({});
  });

  it("is still offered when it has nothing to configure yet", () => {
    // Coming soon is shown to everyone: there is nothing to be permitted to.
    const keys = settingsSubmenuFor(() => undefined, [], [], MODULES).map(
      (item) => item.key
    );
    expect(keys).toContain("sales");
  });

  it("falls back to a placeholder in a build that carries no such module", () => {
    // What the SPA looks like between a module's extraction and the merge
    // of its promote PR: no manifest at all.
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
    expect(settingsHashLanding("#sales-taxes", MODULES)).toEqual({
      module: "sales",
      tab: "sales-taxes",
    });
    expect(settingsHashLanding("#nope", MODULES)).toBeNull();
    expect(settingsHashLanding("", MODULES)).toBeNull();
  });
});

describe("Placeholder modules", () => {
  it("sit after the real ones, whatever the account may do", () => {
    const sampleKeys = samplesOffered();
    expect(sampleKeys.length).toBeGreaterThan(0);

    for (const codes of [
      ["settings.document_layout.edit"],
      ["settings.client.edit"],
      [],
    ]) {
      const keys = settingsSubmenuFor(() => undefined, codes, null, MODULES).map(
        (item) => item.key
      );
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
    expect(SAMPLE_MODULES.some((module) => module.moduleKey === "sales")).toBe(true);
    // With a sales manifest present the placeholder drops out; without
    // one it is what keeps Sales on the navbar.
    expect(samplesOffered()).not.toContain("sample:sales");
    expect(samplesOffered([])).toContain("sample:sales");
  });

  it("are not mistaken for the real modules", () => {
    expect(isSampleModule("general")).toBe(false);
    expect(isSampleModule("sales")).toBe(false);
  });
});

describe("Settings navbar marks", () => {
  it("resolves General through the shared allowlist", () => {
    expect(settingsModuleIcon("general")).toBe(Settings2);

    for (const [key, name] of Object.entries(SETTINGS_MODULE_ICON_NAMES)) {
      expect(resolveModuleIcon(name)).toBe(settingsModuleIcon(key));
    }
  });

  it("takes a module's mark from its own manifest", () => {
    const area = settingsAreas([], null, MODULES).find(
      (candidate) => candidate.key === "sales"
    )!;
    expect(area.icon).toBe(ShoppingCart);
  });

  it("gives every navbar entry -- real or placeholder -- something to render", () => {
    const items = settingsSubmenuFor(
      () => undefined,
      ["settings.client.edit"],
      null,
      MODULES
    );
    expect(items.length).toBeGreaterThan(samplesOffered().length);
    for (const item of items) {
      expect(item.icon).toBeTruthy();
    }
  });
});
