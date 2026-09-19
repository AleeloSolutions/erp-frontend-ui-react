import { renderHook, act } from "@testing-library/react";
import { Package } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { moduleRegistry } from "./index";
import type { ModuleManifest } from "./types";
import {
  getModules,
  registerRuntimeModule,
  resetRuntimeModules,
  useModules,
  whenRegistered,
} from "./registry";

function compiledKeys() {
  return moduleRegistry.map((module) => module.key);
}

function manifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    key: "pos",
    navArea: "sales",
    id: "pos",
    label: "Point of Sale",
    version: "1.0.0",
    icon: Package,
    path: "/pos",
    nav: { key: "pos", label: "Point of Sale", href: "/pos/tickets" },
    Routes: () => null,
    ...overrides,
  };
}

describe("module registry", () => {
  afterEach(() => {
    resetRuntimeModules();
  });

  it("starts with the compiled-in modules", () => {
    expect(getModules().map((module) => module.key)).toEqual(compiledKeys());
  });

  it("adds a runtime module and tells subscribers", () => {
    const { result } = renderHook(() => useModules());
    expect(result.current.map((module) => module.key)).toEqual(compiledKeys());

    act(() => {
      registerRuntimeModule(manifest());
    });
    expect(result.current.map((module) => module.key)).toEqual([
      ...compiledKeys(),
      "pos",
    ]);
  });

  it("replaces an earlier registration of the same key", () => {
    registerRuntimeModule(manifest({ version: "1.0.0" }));
    registerRuntimeModule(manifest({ version: "1.1.0" }));
    const pos = getModules().filter((module) => module.key === "pos");
    expect(pos).toHaveLength(1);
    expect(pos[0].version).toBe("1.1.0");
  });

  it("never lets a runtime module shadow a compiled-in one", () => {
    // Whichever modules this build compiles in -- none, once every module
    // ships as a package -- a runtime one may not take a key they hold.
    const compiled = moduleRegistry[0];
    if (!compiled) {
      expect(compiledKeys()).toEqual([]);
      return;
    }
    registerRuntimeModule(manifest({ key: compiled.key, label: "Impostor" }));
    const held = getModules().filter((module) => module.key === compiled.key);
    expect(held).toHaveLength(1);
    expect(held[0].label).toBe(compiled.label);
  });

  it("resolves whoever is waiting for a key", async () => {
    const waiting = whenRegistered("pos");
    registerRuntimeModule(manifest());
    await expect(waiting).resolves.toMatchObject({ key: "pos" });
    await expect(whenRegistered("pos")).resolves.toMatchObject({ key: "pos" });
  });

  it("refuses a manifest that is not one", () => {
    expect(() => registerRuntimeModule(manifest({ key: "Point Of Sale" }))).toThrow(
      /invalid key/
    );
    expect(() => registerRuntimeModule(manifest({ path: "pos" }))).toThrow(/path/);
    expect(() =>
      registerRuntimeModule({
        ...manifest(),
        nav: undefined,
      } as unknown as ModuleManifest)
    ).toThrow(/nav\.key/);
    expect(getModules().some((module) => module.key === "pos")).toBe(false);
  });
});
