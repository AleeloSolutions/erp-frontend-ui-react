import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RecordSearchModal } from "./RecordSearchModal";
import { Button } from "../../primitives/Button";
import type { PickerItem, RecordSearchColumn } from "./types";

const meta = {
  title: "Composites/RecordSearchModal",
  component: RecordSearchModal,
} satisfies Meta<typeof RecordSearchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const PRODUCTS: PickerItem[] = Array.from({ length: 47 }, (_, index) => ({
  key: `p-${index + 1}`,
  label: `${["Cement", "Rebar", "Timber", "Paint", "Tiles"][index % 5]} ${index + 1}`,
  secondary: ["Warehouse A", "Warehouse B", "Transit"][index % 3],
}));

const COLUMNS: RecordSearchColumn<PickerItem>[] = [
  { header: "Product", cell: (item) => item.label },
  { header: "Location", cell: (item) => item.secondary ?? "—", width: "180px" },
  {
    header: "Reference",
    cell: (item) => <span className="tabular-nums">{item.key.toUpperCase()}</span>,
    width: "120px",
  },
];

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

function makeSearch({
  rows = PRODUCTS,
  latency = 180,
  fail = false,
}: {
  rows?: PickerItem[];
  latency?: number;
  fail?: boolean;
} = {}) {
  return async (
    query: string,
    opts: { signal: AbortSignal; page: number; pageSize: number }
  ) => {
    await wait(latency, opts.signal);
    if (fail) throw new Error("The product service is unreachable");

    const needle = query.trim().toLowerCase();
    const matched = needle
      ? rows.filter((row) =>
          `${row.label} ${row.secondary ?? ""}`.toLowerCase().includes(needle)
        )
      : rows;
    const start = (opts.page - 1) * opts.pageSize;
    return {
      items: matched.slice(start, start + opts.pageSize),
      total: matched.length,
    };
  };
}

function Demo({
  onSearch,
  pageSize,
  initialQuery,
}: {
  onSearch: ReturnType<typeof makeSearch>;
  pageSize?: number;
  initialQuery?: string;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickerItem | null>(null);

  return (
    <div>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Search more…
      </Button>
      <p className="mt-2 mb-0 text-[11px] text-erp-muted" aria-live="polite">
        Selected: {picked ? `${picked.label} (${picked.key})` : "nothing yet"}
      </p>
      <RecordSearchModal
        open={open}
        onClose={() => setOpen(false)}
        onSearch={onSearch}
        columns={COLUMNS}
        pageSize={pageSize}
        initialQuery={initialQuery}
        title="Search: Products"
        onSelect={(item) => {
          setPicked(item);
          setOpen(false);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  name: "Paginated search",
  render: () => <Demo onSearch={makeSearch()} pageSize={8} />,
};

export const SeededQuery: Story = {
  name: "Seeded from the picker's text",
  render: () => <Demo onSearch={makeSearch()} pageSize={8} initialQuery="Cement" />,
};

export const SlowSearch: Story = {
  name: "Slow search (loading state)",
  render: () => <Demo onSearch={makeSearch({ latency: 1600 })} pageSize={8} />,
};

export const FailingSearch: Story = {
  name: "Failed search",
  render: () => <Demo onSearch={makeSearch({ fail: true, latency: 400 })} />,
};

export const EmptyResults: Story = {
  name: "No results",
  render: () => <Demo onSearch={makeSearch({ rows: [] })} />,
};
