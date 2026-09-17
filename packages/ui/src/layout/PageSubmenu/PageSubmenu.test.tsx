import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { describe, expect, it } from "vitest";
import { PageSubmenu } from "./PageSubmenu";
import type { SubmenuItem } from "../../types/navigation";

function renderSubmenu(items: SubmenuItem[], props = {}) {
  return render(
    <MemoryRouter>
      <PageSubmenu items={items} activeKey="sales" {...props} />
    </MemoryRouter>
  );
}

describe("PageSubmenu icons", () => {
  /**
   * lucide-react ships forwardRef objects, not functions. Branching on
   * `typeof icon === "function"` therefore rendered every icon as nothing
   * while typechecking clean and leaving the labels in place -- so the
   * assertion has to be that the mark is on screen, not that the prop
   * holds some particular shape.
   */
  it("renders a LucideIcon, which is not a function", () => {
    expect(typeof ShoppingCart).not.toBe("function");

    const { container } = renderSubmenu([
      { key: "sales", label: "Sales", href: "/settings", icon: ShoppingCart },
    ]);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("renders an already-rendered node, such as a logo", () => {
    renderSubmenu([
      {
        key: "sales",
        label: "Sales",
        href: "/settings",
        icon: <img src="/logo.png" alt="" data-testid="logo" />,
      },
    ]);

    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("leaves the label alone when there is no icon", () => {
    const { container } = renderSubmenu([
      { key: "sales", label: "Sales", href: "/settings" },
    ]);

    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });
});

describe("PageSubmenu tone", () => {
  const items: SubmenuItem[] = [
    { key: "general", label: "General", href: "/settings" },
    { key: "sales", label: "Sales", href: "/settings" },
  ];

  it("marks the open item either way, so the tone is only how it looks", () => {
    for (const tone of ["default", "quiet"] as const) {
      const { unmount } = renderSubmenu(items, { tone });
      expect(screen.getByText("Sales").closest("a")).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(screen.getByText("General").closest("a")).not.toHaveAttribute(
        "aria-current"
      );
      unmount();
    }
  });

  it("drops the filled pill in the quiet tone", () => {
    const { unmount } = renderSubmenu(items, { tone: "default" });
    expect(screen.getByText("Sales").closest("a")?.className).toContain(
      "bg-black/[0.06]"
    );
    unmount();

    renderSubmenu(items, { tone: "quiet" });
    expect(screen.getByText("Sales").closest("a")?.className).not.toContain(
      "bg-black/[0.06]"
    );
  });
});
