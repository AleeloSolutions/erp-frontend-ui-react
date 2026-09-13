import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@erp/ui";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModuleEntry } from "../modulesApi";
import { SettingsModulesPanel } from "./SettingsModulesPanel";

const api = vi.hoisted(() => ({
  reload: vi.fn(),
  installModule: vi.fn(),
  disableModule: vi.fn(),
  invalidateAfterModuleChange: vi.fn(() => Promise.resolve()),
  modules: [] as ModuleEntry[],
  permissions: [] as string[],
}));

vi.mock("../modulesApi", async () => {
  const actual = await vi.importActual<typeof import("../modulesApi")>("../modulesApi");
  return {
    ...actual,
    useModules: () => ({
      modules: api.modules,
      loading: false,
      error: null,
      reload: api.reload,
    }),
    installModule: api.installModule,
    disableModule: api.disableModule,
    invalidateAfterModuleChange: api.invalidateAfterModuleChange,
  };
});

vi.mock("../usersApi", () => ({
  useCurrentUser: () => ({
    uuid: "u1",
    user_type: "owner",
    permissions: api.permissions,
  }),
}));

const SALES: ModuleEntry = {
  uuid: "m1",
  key: "sales",
  label: "Sales",
  version: "1.0.0",
  nav_area: "sales",
  depends_on: [],
  status: "installed",
  installed_at: "2026-09-08T10:00:00Z",
};

const POS_DISABLED: ModuleEntry = {
  uuid: "m2",
  key: "pos",
  label: "Point of Sale",
  version: "1.0.0",
  nav_area: "sales",
  depends_on: ["sales"],
  status: "disabled",
  installed_at: "2026-09-08T11:00:00Z",
};

function renderPanel() {
  return render(
    <ToastProvider>
      <SettingsModulesPanel />
    </ToastProvider>
  );
}

describe("SettingsModulesPanel", () => {
  beforeEach(() => {
    api.reload.mockClear();
    api.installModule.mockReset();
    api.disableModule.mockReset();
    api.invalidateAfterModuleChange.mockClear();
    api.modules = [SALES, POS_DISABLED];
    api.permissions = ["settings.module.view", "settings.module.edit"];
  });

  it("re-enables a disabled module, then invalidates me and the matrix and reloads", async () => {
    api.installModule.mockResolvedValue({ ...POS_DISABLED, status: "installed" });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Re-enable" }));

    await waitFor(() => expect(api.installModule).toHaveBeenCalledWith("pos"));
    await waitFor(() => expect(api.invalidateAfterModuleChange).toHaveBeenCalledTimes(1));
    expect(api.reload).toHaveBeenCalledTimes(1);
  });

  it("asks before disabling, then invalidates and reloads", async () => {
    api.disableModule.mockResolvedValue({ ...SALES, status: "disabled" });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(api.disableModule).not.toHaveBeenCalled();
    const buttons = screen.getAllByRole("button", { name: "Disable" });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(api.disableModule).toHaveBeenCalledWith("sales"));
    await waitFor(() => expect(api.invalidateAfterModuleChange).toHaveBeenCalledTimes(1));
    expect(api.reload).toHaveBeenCalledTimes(1);
  });

  it("offers no buttons without the edit tick", () => {
    api.permissions = ["settings.module.view"];
    renderPanel();

    expect(screen.getByRole("heading", { name: "Sales" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Re-enable" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
  });

  it("will not re-enable a module whose dependency is missing", () => {
    api.modules = [{ ...SALES, status: "disabled" }, POS_DISABLED];
    renderPanel();

    const reenable = screen.getByRole("button", {
      name: "Re-enable",
    }) as HTMLButtonElement;
    expect(reenable.disabled).toBe(true);
    expect(screen.getByText("Re-enable Sales first")).toBeTruthy();
  });

  it("never offers Install", () => {
    renderPanel();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
  });
});
