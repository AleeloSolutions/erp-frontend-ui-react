import { renderHook, act } from "@testing-library/react";
import { Package } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import type { ModuleManifest } from "./types";
import {
  getModules,
  registerRuntimeModule,
  resetRuntimeModules,
  useModules,
  whenRegistered,
} from "./registry";

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
    expect(getModules().map((module) => module.key)).toEqual(["sales", "inv"]);
  });

  it("adds a runtime module and tells subscribers", () => {
    const { result } = renderHook(() => useModules());
    expect(result.current.map((module) => module.key)).toEqual(["sales", "inv"]);

    act(() => {
      registerRuntimeModule(manifest());
    });
    expect(result.current.map((module) => module.key)).toEqual(["sales", "inv", "pos"]);
  });

  it("replaces an earlier registration of the same key", () => {
    registerRuntimeModule(manifest({ version: "1.0.0" }));
    registerRuntimeModule(manifest({ version: "1.1.0" }));
    const pos = getModules().filter((module) => module.key === "pos");
    expect(pos).toHaveLength(1);
    expect(pos[0].version).toBe("1.1.0");
  });

  it("never lets a runtime module shadow a compiled-in one", () => {
    registerRuntimeModule(manifest({ key: "sales", label: "Impostor" }));
    const sales = getModules().find((module) => module.key === "sales");
    expect(sales?.label).toBe("Sales");
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
