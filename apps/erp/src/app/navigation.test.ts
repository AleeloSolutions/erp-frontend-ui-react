import { describe, expect, it } from "vitest";
import { NAV_AREAS, buildNavigation } from "./navigation";

const OWNER_CODES = ["sales.customer.view", "inv.product.view", "settings.role.edit"];

function keys(session: Parameters<typeof buildNavigation>[0]) {
  return buildNavigation(session).map((item) => item.key);
}

describe("buildNavigation", () => {
  it("offers a module only when the tenant has it installed", () => {
    expect(keys({ permissions: OWNER_CODES, enabled_modules: ["sales"] })).toEqual([
      "dashboard",
      "sales",
      "settings",
    ]);
    expect(keys({ permissions: OWNER_CODES, enabled_modules: [] })).toEqual([
      "dashboard",
      "settings",
    ]);
  });

  it("still needs a code behind an installed module", () => {
    expect(
      keys({ permissions: ["settings.role.edit"], enabled_modules: ["sales"] })
    ).toEqual(["dashboard", "settings"]);
  });

  it("offers no module while the session is unknown", () => {
    // "Installed" is not something to guess at; the platform entries stay.
    expect(keys(null)).toEqual(["dashboard", "settings"]);
  });

  it("places modules by area, in the declared order", () => {
    const items = keys({ permissions: OWNER_CODES, enabled_modules: ["inv", "sales"] });
    expect(items).toEqual(["dashboard", "sales", "inventory", "settings"]);
    expect(NAV_AREAS.indexOf("sales")).toBeLessThan(NAV_AREAS.indexOf("operations"));
  });

  it("ignores keys the build does not ship", () => {
    expect(
      keys({ permissions: OWNER_CODES, enabled_modules: ["payroll", "sales"] })
    ).toEqual(["dashboard", "sales", "settings"]);
  });
});
