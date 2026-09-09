import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@erp/ui";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModulePackage } from "./packagesApi";
import ModulePackagesPage from "./ModulePackagesPage";

const api = vi.hoisted(() => ({
  reload: vi.fn(),
  uploadPackage: vi.fn(),
  installPackage: vi.fn(),
  packages: [] as ModulePackage[],
  listeners: new Set<() => void>(),
  setPackages(next: ModulePackage[]) {
    api.packages = next;
    for (const listener of api.listeners) listener();
  },
}));

vi.mock("./packagesApi", async () => {
  const React = await import("react");
  const actual = await vi.importActual<typeof import("./packagesApi")>("./packagesApi");
  return {
    ...actual,
    usePackages: () => {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        const listener = () => bump((n) => n + 1);
        api.listeners.add(listener);
        return () => {
          api.listeners.delete(listener);
        };
      }, []);
      return {
        packages: api.packages,
        loading: false,
        error: null,
        reload: api.reload,
      };
    },
    uploadPackage: api.uploadPackage,
    installPackage: api.installPackage,
  };
});

vi.mock("@/app/session", () => ({
  useSession: () => ({
    uuid: "p1",
    email: "platform@kaabe.local",
    first_name: "Platform",
    last_name: "Staff",
    user_type: "platform",
    permissions: [],
    enabled_modules: [],
    module_bundles: [],
    client: null,
  }),
  displayName: () => "Platform Staff",
  accountKindLabel: () => "Platform staff",
  signOut: vi.fn(),
}));

const UPLOADED: ModulePackage = {
  uuid: "pk1",
  key: "pos",
  version: "1.0.0",
  label: "Point of Sale",
  status: "uploaded",
  has_bundle: true,
  has_styles: false,
  checksum: "abc",
  install_log: "",
  installed_at: null,
  uploaded_by: "platform@kaabe.local",
  created_at: "2026-09-08T10:00:00Z",
  updated_at: "2026-09-08T10:00:00Z",
};

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={["/platform/modules"]}>
        <ModulePackagesPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe("ModulePackagesPage", () => {
  beforeEach(() => {
    api.reload.mockClear();
    api.uploadPackage.mockReset();
    api.installPackage.mockReset();
    api.listeners.clear();
    api.setPackages([UPLOADED]);
  });

  it("uploads the chosen zip and reloads", async () => {
    api.uploadPackage.mockResolvedValue({ ...UPLOADED, uuid: "pk2", version: "1.1.0" });
    renderPage();

    const input = screen.getByLabelText("Package zip") as HTMLInputElement;
    const zip = new File([new Uint8Array([80, 75])], "pos-1.1.0.zip", {
      type: "application/zip",
    });
    fireEvent.change(input, { target: { files: [zip] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => expect(api.uploadPackage).toHaveBeenCalledWith(zip));
    expect(api.reload).toHaveBeenCalledTimes(1);
  });

  it("asks before installing, then starts the pipeline and reloads", async () => {
    api.installPackage.mockResolvedValue({ ...UPLOADED, status: "installing" });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Row actions" }));
    fireEvent.click(screen.getByText("Install"));
    expect(api.installPackage).not.toHaveBeenCalled();
    const buttons = screen.getAllByRole("button", { name: "Install" });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(api.installPackage).toHaveBeenCalledWith("pk1"));
    expect(api.reload).toHaveBeenCalledTimes(1);
  });

  it("shows the install log of the selected package", () => {
    api.setPackages([
      { ...UPLOADED, status: "failed", install_log: "[10:00:00] migrations failed" },
    ]);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Point of Sale" }));
    expect(screen.getByLabelText("Install log").textContent).toContain(
      "migrations failed"
    );
  });
});
