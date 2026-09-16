import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordPicker } from "./RecordPicker";
import type { PickerItem } from "./types";

const ITEMS: PickerItem[] = [
  { key: "c-1", label: "Acme Industries", secondary: "Mogadishu" },
  { key: "c-2", label: "Acme Industries", secondary: "Hargeisa" },
  { key: "c-3", label: "Alpha Traders", secondary: "Kismayo" },
];

function search(items: PickerItem[], total = items.length) {
  return vi.fn(async () => ({ items, total }));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RecordPicker", () => {
  it("lists what the search returned and hands the item back on select", async () => {
    const onChange = vi.fn();
    render(<RecordPicker value={null} onChange={onChange} onSearch={search(ITEMS)} />);

    fireEvent.focus(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", { name: /Alpha Traders/ });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("c-3", ITEMS[2]);
  });

  it("bolds the matched substring and shows the secondary text", async () => {
    render(<RecordPicker value={null} onChange={() => {}} onSearch={search(ITEMS)} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "alp" } });

    const option = await screen.findByRole("option", { name: /Alpha Traders/ });
    expect(option.querySelector("strong")).toHaveTextContent("Alp");
    expect(option).toHaveTextContent("Kismayo");
  });

  it('offers Create "…" even when the text matches a record exactly', async () => {
    render(
      <RecordPicker
        value={null}
        onChange={() => {}}
        onSearch={search(ITEMS)}
        onCreate={async () => "new"}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Acme Industries" } });

    expect(
      await screen.findByRole("option", { name: 'Create "Acme Industries"' })
    ).toBeInTheDocument();
  });

  it("creates from the typed text and selects what onCreate returned", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn(async () => "c-99");
    render(
      <RecordPicker
        value={null}
        onChange={onChange}
        onSearch={search([])}
        onCreate={onCreate}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Brand New Co" } });
    fireEvent.click(await screen.findByRole("option", { name: 'Create "Brand New Co"' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Brand New Co"));
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith("c-99", {
        key: "c-99",
        label: "Brand New Co",
      })
    );
  });

  it("cancels on Escape without creating or committing the typed text", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn(async () => "c-99");
    render(
      <RecordPicker
        value={null}
        onChange={onChange}
        onSearch={search(ITEMS)}
        onCreate={onCreate}
      />
    );

    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Brand New Co" } });
    await screen.findByRole("option", { name: 'Create "Brand New Co"' });

    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCreate).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("cancels on click-away without creating or committing the typed text", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn(async () => "c-99");
    render(
      <RecordPicker
        value={null}
        onChange={onChange}
        onSearch={search(ITEMS)}
        onCreate={onCreate}
      />
    );

    const input = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Brand New Co" } });
    await screen.findByRole("option", { name: 'Create "Brand New Co"' });

    fireEvent.mouseDown(document.body);

    expect(onCreate).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("shows a failed search as an error, not as an empty list", async () => {
    render(
      <RecordPicker
        value={null}
        onChange={() => {}}
        onSearch={vi.fn(async () => {
          throw new Error("offline");
        })}
      />
    );

    fireEvent.focus(screen.getByRole("combobox"));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Search failed. Try again.");
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("shows an empty search as no results", async () => {
    render(<RecordPicker value={null} onChange={() => {}} onSearch={search([])} />);

    fireEvent.focus(screen.getByRole("combobox"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("No results")
    );
  });

  it("hides Search more… until the total exceeds the limit", async () => {
    const columns = [{ header: "Name", cell: (item: PickerItem) => item.label }];
    const { rerender } = render(
      <RecordPicker
        value={null}
        limit={3}
        searchMoreColumns={columns}
        onChange={() => {}}
        onSearch={search(ITEMS)}
      />
    );

    fireEvent.focus(screen.getByRole("combobox"));
    await screen.findByRole("option", { name: /Alpha Traders/ });
    expect(
      screen.queryByRole("option", { name: "Search more..." })
    ).not.toBeInTheDocument();

    rerender(
      <RecordPicker
        value={null}
        limit={3}
        searchMoreColumns={columns}
        onChange={() => {}}
        onSearch={search(ITEMS, 12)}
      />
    );
    fireEvent.mouseDown(document.body);
    fireEvent.focus(screen.getByRole("combobox"));

    expect(
      await screen.findByRole("option", { name: "Search more..." })
    ).toBeInTheDocument();
  });

  it("aborts the superseded request and ignores it when it resolves late", async () => {
    const signals: AbortSignal[] = [];
    const onSearch = vi.fn(async (query: string, opts: { signal: AbortSignal }) => {
      signals.push(opts.signal);
      await sleep(query === "" ? 400 : 20);
      return query === ""
        ? { items: [{ key: "stale", label: "Stale Result" }], total: 1 }
        : { items: [{ key: "fresh", label: "Fresh Result" }], total: 1 };
    });

    render(<RecordPicker value={null} onChange={() => {}} onSearch={onSearch} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "fre" } });

    expect(
      await screen.findByRole("option", { name: /Fresh Result/ })
    ).toBeInTheDocument();
    expect(signals[0]?.aborted).toBe(true);

    // Let the first (slow, aborted) request resolve — it must not win.
    await sleep(450);
    expect(
      screen.queryByRole("option", { name: /Stale Result/ })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Fresh Result/ })).toBeInTheDocument();
  });
});
