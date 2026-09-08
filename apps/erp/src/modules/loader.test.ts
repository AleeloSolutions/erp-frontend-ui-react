import { Package } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { loadModuleBundle, loadModuleBundles, resetModuleLoader } from "./loader";
import { getModules, registerRuntimeModule, resetRuntimeModules } from "./registry";

const BUNDLE = {
  key: "pos",
  version: "1.0.0",
  script: "/v1/modules/pos/bundle/1.0.0/module.js",
  styles: "/v1/modules/pos/bundle/1.0.0/module.css",
};

function injected(selector: string) {
  return document.head.querySelector(selector) as HTMLElement | null;
}

/** What a real bundle does as its last statement. */
function bundleRegisters(key: string) {
  registerRuntimeModule({
    key,
    navArea: "sales",
    id: key,
    label: "Point of Sale",
    version: "1.0.0",
    icon: Package,
    path: `/${key}`,
    nav: { key, label: "Point of Sale", href: `/${key}/tickets` },
    Routes: () => null,
  });
}

describe("module loader", () => {
  afterEach(() => {
    resetModuleLoader();
    resetRuntimeModules();
    document.head.querySelectorAll("[data-module]").forEach((node) => node.remove());
  });

  it("injects the stylesheet and the script, then waits for the registration", async () => {
    const loading = loadModuleBundle(BUNDLE);

    const link = injected('link[data-module="pos"]') as HTMLLinkElement;
    const script = injected('script[data-module="pos"]') as HTMLScriptElement;
    expect(link.getAttribute("href")).toBe("/api/v1/modules/pos/bundle/1.0.0/module.css");
    expect(script.getAttribute("src")).toBe("/api/v1/modules/pos/bundle/1.0.0/module.js");
    expect(script.dataset.version).toBe("1.0.0");

    // jsdom does not fetch: play the script's role.
    bundleRegisters("pos");
    script.dispatchEvent(new Event("load"));
    await expect(loading).resolves.toBeUndefined();
    expect(getModules().some((module) => module.key === "pos")).toBe(true);
  });

  it("asks for a bundle once per version", async () => {
    const first = loadModuleBundle(BUNDLE);
    const second = loadModuleBundle(BUNDLE);
    expect(second).toBe(first);
    expect(document.head.querySelectorAll('script[data-module="pos"]')).toHaveLength(1);
    bundleRegisters("pos");
    injected('script[data-module="pos"]')!.dispatchEvent(new Event("load"));
    await first;
  });

  it("reports a bundle that fails to load without taking the others down", async () => {
    const other = {
      ...BUNDLE,
      key: "hr",
      script: "/v1/modules/hr/bundle/1.0.0/module.js",
      styles: null,
    };
    const all = loadModuleBundles([BUNDLE, other]);

    injected('script[data-module="pos"]')!.dispatchEvent(new Event("error"));
    bundleRegisters("hr");
    injected('script[data-module="hr"]')!.dispatchEvent(new Event("load"));

    await expect(all).resolves.toBeUndefined();
    await expect(loadModuleBundle(BUNDLE)).rejects.toThrow(/failed to load/);
    expect(getModules().some((module) => module.key === "hr")).toBe(true);
    expect(injected('link[data-module="hr"]')).toBeNull();
  });

  it("does nothing for a module that is already registered", async () => {
    bundleRegisters("pos");
    await loadModuleBundle(BUNDLE);
    expect(injected('script[data-module="pos"]')).toBeNull();
  });
});
