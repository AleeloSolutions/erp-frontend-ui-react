import { describe, expect, it } from "vitest";
import { Blocks, ShoppingCart, Warehouse } from "lucide-react";
import {
  DEFAULT_MODULE_ICON,
  DEFAULT_MODULE_ICON_NAME,
  MODULE_ICONS,
  MODULE_ICON_NAMES,
  isModuleIconName,
  resolveModuleIcon,
} from "./moduleIcons";

/**
 * The allowlist the backend validates against, written out rather than
 * derived, so a change on either side of the contract has to be made
 * deliberately on both.
 */
const CONTRACT = [
  "Banknote",
  "Blocks",
  "BookOpen",
  "Boxes",
  "Briefcase",
  "Building2",
  "Calculator",
  "CalendarDays",
  "ChartLine",
  "ClipboardList",
  "Contact",
  "CreditCard",
  "Factory",
  "FileText",
  "Handshake",
  "Landmark",
  "LayoutDashboard",
  "Package",
  "PiggyBank",
  "Receipt",
  "Scan",
  "Settings2",
  "ShieldCheck",
  "ShoppingCart",
  "Store",
  "Tag",
  "Truck",
  "Users",
  "Wallet",
  "Warehouse",
  "Wrench",
];

describe("the module icon allowlist", () => {
  it("is the 31 contract names, in contract order", () => {
    expect(MODULE_ICON_NAMES).toEqual(CONTRACT);
    expect(MODULE_ICON_NAMES).toHaveLength(31);
  });

  it("maps every name to something renderable", () => {
    for (const name of MODULE_ICON_NAMES) {
      expect(MODULE_ICONS[name]).toBeTruthy();
    }
  });

  it("defaults to Blocks", () => {
    expect(DEFAULT_MODULE_ICON_NAME).toBe("Blocks");
    expect(DEFAULT_MODULE_ICON).toBe(Blocks);
  });
});

describe("resolveModuleIcon", () => {
  it("resolves a known name to its icon", () => {
    expect(resolveModuleIcon("ShoppingCart")).toBe(ShoppingCart);
    expect(resolveModuleIcon("Warehouse")).toBe(Warehouse);
  });

  it("resolves every name on the allowlist", () => {
    for (const name of MODULE_ICON_NAMES) {
      expect(resolveModuleIcon(name)).toBe(MODULE_ICONS[name]);
    }
  });

  it("falls back to the default for a name this build does not know", () => {
    expect(resolveModuleIcon("NotAnIconName")).toBe(DEFAULT_MODULE_ICON);
    // Case and kebab spellings are not the contract spelling.
    expect(resolveModuleIcon("shoppingcart")).toBe(DEFAULT_MODULE_ICON);
    expect(resolveModuleIcon("shopping-cart")).toBe(DEFAULT_MODULE_ICON);
  });

  it("treats the empty string as not set", () => {
    expect(resolveModuleIcon("")).toBe(DEFAULT_MODULE_ICON);
  });

  it("survives a backend that has not shipped the field yet", () => {
    expect(resolveModuleIcon(undefined)).toBe(DEFAULT_MODULE_ICON);
    expect(resolveModuleIcon(null)).toBe(DEFAULT_MODULE_ICON);
  });

  it("does not mistake an inherited Object property for a name", () => {
    expect(isModuleIconName("constructor")).toBe(false);
    expect(isModuleIconName("toString")).toBe(false);
    expect(resolveModuleIcon("constructor")).toBe(DEFAULT_MODULE_ICON);
  });

  it("never throws, whatever the wire carries", () => {
    for (const value of ["", "   ", "Blocks ", "💥", "__proto__", "0"]) {
      expect(() => resolveModuleIcon(value)).not.toThrow();
      expect(resolveModuleIcon(value)).toBeTruthy();
    }
  });
});
