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

const POS: ModuleEntry = {
  uuid: null,
  key: "pos",
  label: "Point of Sale",
  version: "1.0.0",
  nav_area: "sales",
  depends_on: ["sales"],
  status: "available",
  installed_at: null,
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
    api.modules = [SALES, POS];
    api.permissions = ["settings.module.view", "settings.module.edit"];
  });

  it("installs a module, then invalidates me and the matrix and reloads", async () => {
    api.installModule.mockResolvedValue({ ...POS, status: "installed", uuid: "m2" });
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Install" }));

    await waitFor(() => expect(api.installModule).toHaveBeenCalledWith("pos"));
    await waitFor(() => expect(api.invalidateAfterModuleChange).toHaveBeenCalledTimes(1));
    expect(api.reload).toHaveBeenCalledTimes(1);
  });

  it("asks before disabling, then invalidates and reloads", async () => {
    api.disableModule.mockResolvedValue({ ...SALES, status: "disabled" });
    renderPanel();

    // The card's button opens the confirmation; the dialog's confirms it.
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
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
  });

  it("will not install a module whose dependency is missing", () => {
    api.modules = [{ ...SALES, status: "disabled" }, POS];
    renderPanel();

    // POS needs sales, which is off: its button is disabled and says why.
    const install = screen.getByRole("button", { name: "Install" }) as HTMLButtonElement;
    expect(install.disabled).toBe(true);
    expect(screen.getByText("Install Sales first")).toBeTruthy();
  });
});
