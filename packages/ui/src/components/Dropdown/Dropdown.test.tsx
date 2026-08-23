import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dropdown } from "./Dropdown";

const items = [
  { key: "400000 Product Sales", label: "400000 Product Sales" },
  { key: "400010 Service Revenue", label: "400010 Service Revenue" },
];

describe("Dropdown searchable", () => {
  it("without allowFreeText, reverts to the last selection when dismissed without picking an item", () => {
    render(
      <Dropdown
        trigger="field"
        searchable
        value="400000 Product Sales"
        items={items}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a value not in the list" } });
    fireEvent.mouseDown(document.body);
    expect(input.value).toBe("400000 Product Sales");
  });

  it("with allowFreeText, commits typed text that doesn't match any item on dismiss", () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        trigger="field"
        searchable
        allowFreeText
        value="400000 Product Sales"
        items={items}
        onChange={onChange}
      />
    );
    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Custom Account 12345" } });
    fireEvent.mouseDown(document.body);
    expect(onChange).toHaveBeenCalledWith("Custom Account 12345", {
      key: "Custom Account 12345",
      label: "Custom Account 12345",
    });
  });

  it("with allowFreeText, still commits the picked item (not the raw query) when a list item is clicked", () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        trigger="field"
        searchable
        allowFreeText
        value={null}
        items={items}
        onChange={onChange}
      />
    );
    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Revenue" } });
    fireEvent.click(screen.getByRole("option", { name: "400010 Service Revenue" }));
    expect(onChange).toHaveBeenCalledWith("400010 Service Revenue", items[1]);
  });
});
