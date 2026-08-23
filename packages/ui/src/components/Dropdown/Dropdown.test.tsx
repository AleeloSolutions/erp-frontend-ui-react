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

  it("reopening after a selection shows every option, not just the one matching the current value", () => {
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
    expect(screen.getByRole("option", { name: "400000 Product Sales" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "400010 Service Revenue" })).toBeInTheDocument();
  });
});

describe("Dropdown clearable", () => {
  it("shows a clear control for a plain field select once a value is chosen, and clears it on click", () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        trigger="field"
        clearable
        value="400000 Product Sales"
        items={items}
        onChange={onChange}
      />
    );
    const clearButton = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it("shows a clear control for a searchable combobox once a value is chosen, and clears it on click", () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        trigger="field"
        searchable
        clearable
        value="400000 Product Sales"
        items={items}
        onChange={onChange}
      />
    );
    const clearButton = screen.getByRole("button", { name: "Clear" });
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it("does not show a clear control when nothing is selected", () => {
    render(
      <Dropdown trigger="field" clearable value={null} items={items} onChange={() => {}} />
    );
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });
});
