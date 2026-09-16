import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RecordPicker } from "./RecordPicker";
import { RecordFormFields } from "../RecordForm/RecordFormFields";
import { RecordFormModal } from "../RecordForm/RecordFormModal";
import type { FieldAdapter, FieldSpec } from "../RecordForm/types";
import type { PickerItem, RecordSearchColumn } from "./types";

/**
 * Everything async here is mocked in the story — no network. The point of the
 * component is that `packages/ui` never knows what a customer is: it gets
 * `onSearch` / `onCreate` / `onCreateAndEdit` and renders.
 */
const meta = {
  title: "Composites/RecordPicker",
  component: RecordPicker,
} satisfies Meta<typeof RecordPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const CUSTOMERS: PickerItem[] = [
  { key: "c-1", label: "Acme Industries", secondary: "Mogadishu" },
  { key: "c-2", label: "Acme Industries", secondary: "Hargeisa" },
  { key: "c-3", label: "Acme Logistics", secondary: "Bosaso" },
  { key: "c-4", label: "Alpha Traders", secondary: "Kismayo" },
  { key: "c-5", label: "Bakaara Wholesale", secondary: "Mogadishu" },
  { key: "c-6", label: "Berbera Shipping", secondary: "Berbera" },
  { key: "c-7", label: "Cabdulle & Sons", secondary: "Galkayo" },
  { key: "c-8", label: "Dahabshiil Retail", secondary: "Hargeisa" },
  { key: "c-9", label: "Eastgate Motors", secondary: "Mogadishu" },
  { key: "c-10", label: "Farah Hardware", secondary: "Baidoa" },
  { key: "c-11", label: "Gollis Foods", secondary: "Burco" },
  { key: "c-12", label: "Horn Telecom", secondary: "Mogadishu" },
  { key: "c-13", label: "Indho Ocean Freight", secondary: "Bosaso" },
  { key: "c-14", label: "Jubba Agro", secondary: "Jamaame" },
];

const COLUMNS: RecordSearchColumn<PickerItem>[] = [
  { header: "Name", cell: (item) => item.label },
  { header: "City", cell: (item) => item.secondary ?? "—", width: "160px" },
  { header: "Reference", cell: (item) => item.key.toUpperCase(), width: "120px" },
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
  rows = CUSTOMERS,
  latency = 160,
  fail = false,
}: {
  rows?: PickerItem[];
  latency?: number;
  fail?: boolean;
} = {}) {
  return async (
    query: string,
    opts: { signal: AbortSignal; page?: number; pageSize?: number }
  ) => {
    await wait(latency, opts.signal);
    if (fail) throw new Error("The customer service is unreachable");

    const needle = query.trim().toLowerCase();
    const matched = needle
      ? rows.filter((row) =>
          `${row.label} ${row.secondary ?? ""}`.toLowerCase().includes(needle)
        )
      : rows;

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? matched.length;
    const start = (page - 1) * pageSize;
    return { items: matched.slice(start, start + pageSize), total: matched.length };
  };
}

function Log({ entries }: { entries: string[] }) {
  return (
    <div className="mt-4 w-[420px]">
      <p className="m-0 text-[10px] font-bold uppercase text-erp-muted">Events</p>
      <ul className="m-0 mt-1 list-none p-0 text-[11px] text-erp-text" aria-live="polite">
        {entries.length === 0 ? (
          <li className="text-erp-muted">Nothing yet.</li>
        ) : (
          entries.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)
        )}
      </ul>
    </div>
  );
}

function Demo({
  onSearch,
  limit,
  withCreate = true,
  withCreateAndEdit = true,
  withSearchMore = true,
  createLatency = 700,
  createFails = false,
  initialValue = null,
  initialLabel,
  error,
  disabled,
  note,
}: {
  onSearch: ReturnType<typeof makeSearch>;
  limit?: number;
  withCreate?: boolean;
  withCreateAndEdit?: boolean;
  withSearchMore?: boolean;
  createLatency?: number;
  createFails?: boolean;
  initialValue?: string | null;
  initialLabel?: string;
  error?: boolean;
  disabled?: boolean;
  note?: string;
}) {
  const [value, setValue] = useState<string | null>(initialValue);
  const [label, setLabel] = useState<string | undefined>(initialLabel);
  const [entries, setEntries] = useState<string[]>([]);

  const log = (entry: string) => setEntries((prev) => [...prev, entry]);

  return (
    <div>
      {note ? <p className="m-0 mb-2 text-[11px] text-erp-muted">{note}</p> : null}
      <div className="w-[420px]">
        <RecordPicker
          id="story-customer"
          placeholder="Search a customer"
          value={value}
          valueLabel={label}
          limit={limit}
          error={error}
          disabled={disabled}
          onSearch={onSearch}
          searchMoreColumns={withSearchMore ? COLUMNS : undefined}
          searchMoreTitle="Search: Customers"
          onCreate={
            withCreate
              ? async (text) => {
                  await wait(createLatency);
                  if (createFails) throw new Error("Server said no");
                  log(`onCreate("${text}") -> new-${text.length}`);
                  return `new-${text.length}`;
                }
              : undefined
          }
          onCreateAndEdit={
            withCreateAndEdit ? (text) => log(`onCreateAndEdit("${text}")`) : undefined
          }
          onChange={(key, item) => {
            setValue(key);
            setLabel(item?.label);
            log(
              `onChange(${key === null ? "null" : `"${key}"`}, ${item?.label ?? "null"})`
            );
          }}
        />
      </div>
      <Log entries={entries} />
    </div>
  );
}

export const Default: Story = {
  name: "Fast search",
  render: () => (
    <Demo
      onSearch={makeSearch()}
      note="Type to search. Escape or a click outside cancels — it never creates."
    />
  ),
};

export const SlowSearch: Story = {
  name: "Slow search (loading state)",
  render: () => (
    <Demo
      onSearch={makeSearch({ latency: 1600 })}
      note="Every keystroke aborts the request in flight; only the newest answer lands."
    />
  ),
};

export const FailingSearch: Story = {
  name: "Failed search (distinct from empty)",
  render: () => (
    <Demo
      onSearch={makeSearch({ fail: true, latency: 400 })}
      note="A failed search says so in red — it must never read as “no results”."
    />
  ),
};

export const EmptyResults: Story = {
  name: "No results",
  render: () => (
    <Demo
      onSearch={makeSearch({ rows: [] })}
      note="Nothing found, but Create “…” is still offered."
    />
  ),
};

export const SearchMore: Story = {
  name: "More rows than the limit",
  render: () => (
    <Demo
      onSearch={makeSearch()}
      limit={3}
      note="limit=3 against 14 records, so Search more… opens the paginated dialog."
    />
  ),
};

export const DuplicateLabels: Story = {
  name: "Duplicate names, told apart by secondary",
  render: () => (
    <Demo
      onSearch={makeSearch({
        rows: CUSTOMERS.filter((row) => row.label.startsWith("Acme")),
      })}
      note="Type “acme”: two records share a name and are distinguished by city."
    />
  ),
};

export const CreateOnly: Story = {
  name: "Quick create only",
  render: () => (
    <Demo
      onSearch={makeSearch()}
      withCreateAndEdit={false}
      withSearchMore={false}
      note="Without onCreateAndEdit / searchMoreColumns those rows are not rendered."
    />
  ),
};

export const CreateFails: Story = {
  name: "Quick create fails",
  render: () => (
    <Demo
      onSearch={makeSearch()}
      createFails
      createLatency={900}
      note="The field is busy while creating, and the failure is shown, not swallowed."
    />
  ),
};

export const Preselected: Story = {
  name: "Pre-selected value",
  render: () => (
    <Demo
      onSearch={makeSearch()}
      initialValue="c-5"
      initialLabel="Bakaara Wholesale"
      note="A saved record has a key but no row yet — valueLabel renders it."
    />
  ),
};

export const States: Story = {
  name: "Error and disabled",
  render: () => (
    <div className="flex flex-col gap-6">
      <Demo onSearch={makeSearch()} error note="error" withSearchMore={false} />
      <Demo
        onSearch={makeSearch()}
        disabled
        initialValue="c-5"
        initialLabel="Bakaara Wholesale"
        note="disabled"
        withSearchMore={false}
      />
    </div>
  ),
};

const QUICK_CUSTOMER_FIELDS: FieldSpec[] = [
  { kind: "text", name: "name", label: "Customer name", required: true, span: 12 },
  { kind: "email", name: "email", label: "Email", span: 6 },
  { kind: "text", name: "city", label: "City", span: 6 },
];

function CreateAndEditDemo() {
  const [value, setValue] = useState<string | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const adapter: FieldAdapter = {
    field: (name) => ({
      name,
      value: values[name] ?? "",
      onChange: (event: { target: { value: string } }) =>
        setValues((prev) => ({ ...prev, [name]: event.target.value })),
    }),
    error: () => undefined,
  };

  return (
    <div className="w-[420px]">
      <p className="m-0 mb-2 text-[11px] text-erp-muted">
        Create and edit… hands the typed text back; the consumer opens its own form.
      </p>
      <RecordPicker
        placeholder="Search a customer"
        value={value}
        valueLabel={label}
        onSearch={makeSearch()}
        onCreateAndEdit={(text) => {
          setValues({ name: text });
          setDraft(text);
        }}
      />
      <RecordFormModal
        open={draft !== null}
        title="New customer"
        onClose={() => setDraft(null)}
        onSave={() => {
          const name = values.name ?? draft ?? "";
          setValue(`new-${name.length}`);
          setLabel(name);
          setDraft(null);
        }}
      >
        <RecordFormFields fields={QUICK_CUSTOMER_FIELDS} adapter={adapter} />
      </RecordFormModal>
    </div>
  );
}

export const CreateAndEdit: Story = {
  name: "Create and edit… opens the consumer's form",
  render: () => <CreateAndEditDemo />,
};
