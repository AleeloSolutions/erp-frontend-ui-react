import { Package } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadModuleBundle,
  loadModuleBundles,
  pendingBundles,
  resetModuleLoader,
} from "./loader";
import { getModules, registerRuntimeModule, resetRuntimeModules } from "./registry";

const assets = vi.hoisted(() => ({
  responses: new Map<string, string | Error>(),
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiFetch: assets.apiFetch,
}));

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
  beforeEach(() => {
    assets.responses.clear();
    assets.apiFetch.mockClear();
    assets.apiFetch.mockImplementation((path: string) => {
      const response = assets.responses.get(path);
      if (response instanceof Error) return Promise.reject(response);
      if (response === undefined) return Promise.reject(new Error(`404 ${path}`));
      return Promise.resolve(response);
    });
  });

  afterEach(() => {
    resetModuleLoader();
    resetRuntimeModules();
    document.head.querySelectorAll("[data-module]").forEach((node) => node.remove());
  });

  it("fetches the stylesheet and the script with the session, injects them, and waits for the registration", async () => {
    assets.responses.set(BUNDLE.styles, ".pos-till { display: grid }");
    assets.responses.set(BUNDLE.script, "/* the pos bundle */");
    const loading = loadModuleBundle(BUNDLE);
    // jsdom does not run the inline script: play the bundle's role.
    await new Promise((resolve) => setTimeout(resolve, 0));
    bundleRegisters("pos");
    await expect(loading).resolves.toBeUndefined();

    expect(assets.apiFetch).toHaveBeenCalledWith(
      BUNDLE.script,
      expect.objectContaining({ method: "GET", unwrap: false })
    );
    expect(injected('style[data-module="pos"]')?.textContent).toContain(".pos-till");
    const script = injected('script[data-module="pos"]') as HTMLScriptElement;
    expect(script.textContent).toContain("/* the pos bundle */");
    expect(script.dataset.version).toBe("1.0.0");
    expect(getModules().some((module) => module.key === "pos")).toBe(true);
  });

  it("asks for a bundle once per version", async () => {
    assets.responses.set(BUNDLE.styles, "");
    assets.responses.set(BUNDLE.script, "/* pos */");
    const first = loadModuleBundle(BUNDLE);
    const second = loadModuleBundle(BUNDLE);
    expect(second).toBe(first);
    await new Promise((resolve) => setTimeout(resolve, 0));
    bundleRegisters("pos");
    await first;
    expect(assets.apiFetch).toHaveBeenCalledTimes(2); // one script, one stylesheet
  });

  it("reports a bundle that fails to load without taking the others down", async () => {
    const other = {
      ...BUNDLE,
      key: "hr",
      script: "/v1/modules/hr/bundle/1.0.0/module.js",
      styles: null,
    };
    assets.responses.set(BUNDLE.script, new Error("401 Unauthorized"));
    assets.responses.set(BUNDLE.styles, "");
    assets.responses.set(other.script, "/* hr */");
    const all = loadModuleBundles([BUNDLE, other]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    bundleRegisters("hr");

    await expect(all).resolves.toBeUndefined();
    await expect(loadModuleBundle(BUNDLE)).rejects.toThrow(/401/);
    expect(getModules().some((module) => module.key === "hr")).toBe(true);
    expect(injected('script[data-module="pos"]')).toBeNull();
  });

  it("knows which bundles are still on their way", async () => {
    // Named, not registered, not failed: pending.
    expect(pendingBundles([BUNDLE]).map((bundle) => bundle.key)).toEqual(["pos"]);
    // Registered: no longer pending.
    bundleRegisters("pos");
    expect(pendingBundles([BUNDLE])).toEqual([]);
    // Failed: given up on, so a URL is not held hostage.
    const hr = {
      ...BUNDLE,
      key: "hr",
      script: "/v1/modules/hr/bundle/1.0.0/module.js",
      styles: null,
    };
    assets.responses.set(hr.script, new Error("boom"));
    await loadModuleBundles([hr]);
    expect(pendingBundles([hr])).toEqual([]);
  });

  it("does nothing for a module that is already registered", async () => {
    bundleRegisters("pos");
    await loadModuleBundle(BUNDLE);
    expect(assets.apiFetch).not.toHaveBeenCalled();
    expect(injected('script[data-module="pos"]')).toBeNull();
  });
});
