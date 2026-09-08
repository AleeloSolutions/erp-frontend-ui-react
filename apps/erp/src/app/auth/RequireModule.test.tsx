import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isModuleEnabled } from "@/app/access";
import type { Session } from "@/app/session";
import { RequireModule } from "./RequireModule";

const session = vi.hoisted(() => ({ current: null as Session | null }));

vi.mock("@/app/session", () => ({
  useSession: () => session.current,
}));

function asSession(enabled_modules: string[]): Session {
  return {
    uuid: "u1",
    email: "owner@kaabe.local",
    first_name: "Owner",
    last_name: "",
    user_type: "owner",
    permissions: [],
    enabled_modules,
    client: { name: "Kaabe Demo", slug: "kaabe-demo" },
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route
          path="/sales/*"
          element={
            <RequireModule module="sales">
              <p>sales screen</p>
            </RequireModule>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireModule", () => {
  beforeEach(() => {
    session.current = null;
  });

  it("renders the module while the tenant has it installed", () => {
    session.current = asSession(["sales"]);
    renderAt("/sales/customers");
    expect(screen.getByText("sales screen")).toBeTruthy();
  });

  it("answers like a URL that never existed when it is not", () => {
    session.current = asSession([]);
    renderAt("/sales/customers");
    expect(screen.queryByText("sales screen")).toBeNull();
    expect(screen.getByText("home")).toBeTruthy();
  });

  it("lets the route render while the session is unknown", () => {
    renderAt("/sales/customers");
    expect(screen.getByText("sales screen")).toBeTruthy();
    expect(isModuleEnabled(null, "sales")).toBe(true);
    expect(isModuleEnabled({ enabled_modules: [] }, "sales")).toBe(false);
  });
});
