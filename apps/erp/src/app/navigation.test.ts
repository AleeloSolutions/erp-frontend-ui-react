import { Package } from "lucide-react";
import { describe, expect, it } from "vitest";
import { moduleRegistry } from "@/modules";
import type { ModuleManifest } from "@/modules/types";
import { NAV_AREAS, buildNavigation } from "./navigation";

const OWNER_CODES = ["sales.customer.view", "inv.product.view", "settings.role.edit"];

const POS: ModuleManifest = {
  key: "pos",
  navArea: "sales",
  id: "pos",
  label: "Point of Sale",
  version: "1.0.0",
  icon: Package,
  path: "/pos",
  nav: { key: "pos", label: "Point of Sale", href: "/pos/tickets" },
  resources: ["pos.ticket"],
  Routes: () => null,
};

function keys(
  session: Parameters<typeof buildNavigation>[0],
  modules: readonly ModuleManifest[] = moduleRegistry
) {
  return buildNavigation(session, modules).map((item) => item.key);
}

describe("buildNavigation", () => {
  it("offers a module only when the tenant has it installed", () => {
    expect(
      keys({ permissions: OWNER_CODES, enabled_modules: ["sales"], user_type: "owner" })
    ).toEqual(["dashboard", "sales", "settings"]);
    expect(
      keys({ permissions: OWNER_CODES, enabled_modules: [], user_type: "owner" })
    ).toEqual(["dashboard", "settings"]);
  });

  it("still needs a code behind an installed module", () => {
    expect(
      keys({
        permissions: ["settings.role.edit"],
        enabled_modules: ["sales"],
        user_type: "owner",
      })
    ).toEqual(["dashboard", "settings"]);
  });

  it("offers only unrestricted entries while the session is unknown", () => {
    // No tokens → signed out: Settings must not flash open. Dashboard has
    // an empty requirement list so it stays.
    expect(keys(null)).toEqual(["dashboard"]);
  });

  it("places modules by area, in the declared order", () => {
    const items = keys({
      permissions: OWNER_CODES,
      enabled_modules: ["sales"],
      user_type: "owner",
    });
    expect(items).toEqual(["dashboard", "sales", "settings"]);
    expect(NAV_AREAS.indexOf("sales")).toBeLessThan(NAV_AREAS.indexOf("operations"));
  });

  it("ignores keys the build does not ship", () => {
    expect(
      keys({
        permissions: OWNER_CODES,
        enabled_modules: ["payroll", "sales"],
        user_type: "owner",
      })
    ).toEqual(["dashboard", "sales", "settings"]);
  });

  it("offers a runtime module through its own resources", () => {
    const modules = [...moduleRegistry, POS];
    const session = {
      permissions: ["pos.ticket.view_own"],
      enabled_modules: ["pos"],
      user_type: "member" as const,
    };
    expect(keys(session, modules)).toEqual(["dashboard", "pos"]);
    // A rung on the module's resource is what makes it worth showing.
    expect(keys({ ...session, permissions: ["sales.customer.view"] }, modules)).toEqual([
      "dashboard",
    ]);
  });

  it("hides Settings when no Settings tab would be usable", () => {
    expect(
      keys({
        permissions: ["sales.customer.view", "sales.quotation.view"],
        enabled_modules: ["sales"],
        user_type: "member",
      })
    ).toEqual(["dashboard", "sales"]);
    // Branch-only grants must not open Settings (no Branches tab; Users stays locked).
    expect(
      keys({
        permissions: ["settings.branch.create", "settings.branch.edit"],
        enabled_modules: ["sales"],
        user_type: "member",
      })
    ).toEqual(["dashboard"]);
  });

  it("offers Settings for company or document-layout grants", () => {
    expect(
      keys({
        permissions: ["sales.customer.view", "settings.client.edit"],
        enabled_modules: ["sales"],
        user_type: "member",
      })
    ).toEqual(["dashboard", "sales", "settings"]);
    expect(
      keys({
        permissions: ["settings.document_layout.edit"],
        enabled_modules: ["sales"],
        user_type: "member",
      })
    ).toEqual(["dashboard", "settings"]);
    expect(
      keys({
        permissions: ["settings.sales.edit"],
        enabled_modules: ["sales"],
        user_type: "member",
      })
    ).toEqual(["dashboard", "settings"]);
  });

  it("only offers Sales children the account can view", () => {
    const items = buildNavigation(
      {
        permissions: ["sales.customer.view_own"],
        enabled_modules: ["sales"],
        user_type: "member",
      },
      moduleRegistry
    );
    const sales = items.find((item) => item.key === "sales");
    expect(sales?.children?.map((c) => c.key)).toEqual(["customers"]);
    expect(sales?.href).toBe("/sales/customers");
  });

  it("gives platform accounts the package screen", () => {
    expect(keys({ permissions: [], enabled_modules: [], user_type: "platform" })).toEqual(
      ["dashboard", "platform-modules"]
    );
  });

  it("hides Settings for platform even when they hold every code", () => {
    const items = keys({
      permissions: OWNER_CODES,
      enabled_modules: ["sales"],
      user_type: "platform",
    });
    expect(items).toContain("platform-modules");
    expect(items).not.toContain("settings");
  });
});
