import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef, useState } from "react";
import { RecordFormFields } from "./RecordFormFields";
import { RecordFormModal } from "./RecordFormModal";
import type { FieldAdapter, FieldOption, FieldSpec } from "./types";
import { RecordPicker } from "../RecordPicker/RecordPicker";
import type { PickerItem } from "../RecordPicker/types";
import { Button } from "../../primitives/Button";

const meta = {
  title: "Composites/RecordForm",
  component: RecordFormFields,
} satisfies Meta<typeof RecordFormFields>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Stands in for the app's react-hook-form adapter. `packages/ui` imports no
 * form library — the schema only ever sees `field()` / `error()`.
 */
function useDemoAdapter(
  initial: Record<string, unknown> = {},
  errors: Record<string, string> = {}
) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const initialRef = useRef(initial);

  const adapter: FieldAdapter = {
    field: (name, opts) => {
      const seed = initialRef.current[name];
      const props: Record<string, unknown> = {
        name,
        onChange: (event: {
          target: { value: string; type?: string; checked?: boolean };
        }) => {
          const target = event.target;
          const raw = target.type === "checkbox" ? Boolean(target.checked) : target.value;
          setValues((prev) => ({
            ...prev,
            [name]: opts?.valueAsNumber && typeof raw === "string" ? Number(raw) : raw,
          }));
        },
      };
      if (typeof seed === "boolean") props.defaultChecked = seed;
      else if (seed !== undefined) props.defaultValue = seed;
      return props;
    },
    error: (name) => errors[name],
  };

  return { values, adapter };
}

function Values({ values }: { values: Record<string, unknown> }) {
  return (
    <div className="p-[13px]">
      <p className="m-0 text-[10px] font-bold uppercase text-erp-muted">Adapter values</p>
      <pre className="m-0 mt-1 text-[11px] text-erp-text">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
}

const SALES_REPS: PickerItem[] = [
  { key: "u-1", label: "Amina Yusuf", secondary: "Mogadishu" },
  { key: "u-2", label: "Bashir Warsame", secondary: "Hargeisa" },
  { key: "u-3", label: "Caasho Nuur", secondary: "Bosaso" },
];

/** The `custom` escape hatch: a control the schema cannot describe. */
function SalesRepField({ disabled }: { disabled: boolean }) {
  const [value, setValue] = useState<string | null>(null);
  const [label, setLabel] = useState<string | undefined>(undefined);

  return (
    <RecordPicker
      placeholder="Search a sales rep"
      value={value}
      valueLabel={label}
      disabled={disabled}
      onSearch={async (query) => {
        const needle = query.trim().toLowerCase();
        const items = needle
          ? SALES_REPS.filter((rep) => rep.label.toLowerCase().includes(needle))
          : SALES_REPS;
        return { items, total: items.length };
      }}
      onChange={(key, item) => {
        setValue(key);
        setLabel(item?.label);
      }}
    />
  );
}

const CURRENCIES: FieldOption[] = [
  { value: "USD", label: "USD" },
  { value: "SOS", label: "SOS" },
  { value: "AED", label: "AED" },
];

/** Every `FieldSpec` kind, including `custom` and an `optionsKey` select. */
const ALL_KINDS: FieldSpec[] = [
  {
    kind: "text",
    name: "reference",
    label: "Reference",
    span: 6,
    description: "No section — leading unsectioned grid.",
  },
  {
    kind: "text",
    name: "name",
    label: "Customer name",
    section: "Basic information",
    required: true,
    span: 6,
    chrome: "tick",
    chromeEdge: "end",
  },
  {
    kind: "radio",
    name: "customer_type",
    label: "Type",
    section: "Basic information",
    span: 12,
    options: [
      { value: "organization", label: "Organization" },
      { value: "person", label: "Person" },
    ],
  },
  {
    kind: "email",
    name: "email",
    label: "Email",
    section: "Basic information",
    span: 6,
  },
  {
    kind: "date",
    name: "customer_since",
    label: "Customer since",
    section: "Basic information",
    span: 6,
  },
  {
    kind: "select",
    name: "currency",
    label: "Currency",
    section: "Billing",
    span: 3,
    options: CURRENCIES,
  },
  {
    kind: "select",
    name: "tax",
    label: "Default tax",
    section: "Billing",
    span: 3,
    optionsKey: "taxes",
    description: "Choices arrive from a live query.",
  },
  {
    kind: "number",
    name: "payment_terms_days",
    label: "Payment terms",
    section: "Billing",
    span: 3,
    min: 0,
    valueAsNumber: true,
    description: "Days until a sale falls due. Zero means on receipt.",
  },
  {
    kind: "checkbox",
    name: "credit_hold",
    label: "Credit hold",
    section: "Billing",
    span: 3,
  },
  {
    kind: "custom",
    name: "sales_rep",
    label: "Sales rep",
    section: "Billing",
    span: 6,
    render: ({ disabled }) => <SalesRepField disabled={disabled} />,
  },
  {
    kind: "textarea",
    name: "notes",
    label: "Notes",
    section: "Notes",
    span: 12,
    maxLength: 500,
  },
];

function AllKindsDemo({
  readOnly = false,
  errors = {},
}: {
  readOnly?: boolean;
  errors?: Record<string, string>;
}) {
  const { values, adapter } = useDemoAdapter(
    {
      reference: "CUST-0042",
      name: "Acme Industries",
      payment_terms_days: 30,
      credit_hold: false,
    },
    errors
  );
  const [taxes, setTaxes] = useState<FieldOption[]>([]);

  // Options resolved at render time through `optionsKey`, so the schema above
  // stays static while its choices come from a query.
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setTaxes([
          { value: "vat-5", label: "VAT 5%" },
          { value: "vat-15", label: "VAT 15%" },
          { value: "exempt", label: "Exempt" },
        ]),
      800
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-[760px] border border-erp-border bg-erp-surface">
      <RecordFormFields
        fields={ALL_KINDS}
        adapter={adapter}
        options={{ taxes }}
        readOnly={readOnly}
      />
      <Values values={values} />
    </div>
  );
}

export const AllFieldKinds: Story = {
  name: "Every field kind",
  render: () => <AllKindsDemo />,
};

export const WithErrors: Story = {
  render: () => (
    <AllKindsDemo
      errors={{
        name: "Customer name is required.",
        email: "Enter a valid email address.",
        payment_terms_days: "Must be zero or more.",
      }}
    />
  ),
};

export const ReadOnly: Story = {
  name: "Read only",
  render: () => <AllKindsDemo readOnly />,
};

/** The fields of the app's hand-written CustomerForm, expressed as data. */
const CUSTOMER_SCHEMA: FieldSpec[] = [
  {
    kind: "radio",
    name: "customer_type",
    label: "Type",
    section: "Basic information",
    span: 12,
    options: [
      { value: "organization", label: "Organization" },
      { value: "person", label: "Person" },
    ],
  },
  {
    kind: "text",
    name: "name",
    label: "Customer name",
    section: "Basic information",
    required: true,
    span: 6,
    chrome: "tick",
    chromeEdge: "end",
  },
  {
    kind: "text",
    name: "tax_number",
    label: "Tax number",
    section: "Basic information",
    span: 6,
  },
  { kind: "email", name: "email", label: "Email", section: "Basic information", span: 6 },
  { kind: "text", name: "phone", label: "Phone", section: "Basic information", span: 3 },
  {
    kind: "text",
    name: "mobile",
    label: "Mobile",
    section: "Basic information",
    span: 3,
  },
  {
    kind: "text",
    name: "currency",
    label: "Currency",
    section: "Billing",
    span: 3,
    maxLength: 3,
    description: "Three-letter code, e.g. USD.",
  },
  {
    kind: "number",
    name: "payment_terms_days",
    label: "Payment terms",
    section: "Billing",
    span: 3,
    min: 0,
    valueAsNumber: true,
    description: "Days until a sale falls due. Zero means on receipt.",
  },
  {
    kind: "text",
    name: "address_line1",
    label: "Address line 1",
    section: "Address",
    span: 6,
  },
  {
    kind: "text",
    name: "address_line2",
    label: "Address line 2",
    section: "Address",
    span: 6,
  },
  { kind: "text", name: "city", label: "City", section: "Address", span: 3 },
  { kind: "text", name: "state", label: "State or region", section: "Address", span: 3 },
  {
    kind: "text",
    name: "postal_code",
    label: "Postal code",
    section: "Address",
    span: 3,
  },
  {
    kind: "text",
    name: "country",
    label: "Country",
    section: "Address",
    span: 3,
    maxLength: 2,
    description: "Two-letter code, e.g. SO.",
  },
  { kind: "textarea", name: "notes", label: "Notes", section: "Notes", span: 12 },
];

function CustomerSchemaDemo() {
  const { values, adapter } = useDemoAdapter({ currency: "USD" });
  return (
    <div className="w-[760px] border border-erp-border bg-erp-surface">
      <RecordFormFields fields={CUSTOMER_SCHEMA} adapter={adapter} />
      <Values values={values} />
    </div>
  );
}

export const CustomerSchema: Story = {
  name: "Customer form as a schema",
  render: () => <CustomerSchemaDemo />,
};

function ModalDemo({
  saving = false,
  error = null,
}: {
  saving?: boolean;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { adapter } = useDemoAdapter({ name: "Acme Industries" });

  return (
    <div>
      <Button variant="primary" onClick={() => setOpen(true)}>
        New customer
      </Button>
      <RecordFormModal
        open={open}
        title="New customer"
        saving={saving}
        error={error}
        onClose={() => setOpen(false)}
        onSave={() => setOpen(false)}
      >
        <RecordFormFields fields={CUSTOMER_SCHEMA.slice(0, 6)} adapter={adapter} />
      </RecordFormModal>
    </div>
  );
}

export const InModal: Story = {
  name: "In a RecordFormModal",
  render: () => <ModalDemo />,
};

export const ModalSaving: Story = {
  name: "Modal — saving",
  render: () => <ModalDemo saving />,
};

export const ModalError: Story = {
  name: "Modal — save failed",
  render: () => (
    <ModalDemo error="Could not save the customer: tax number already exists." />
  ),
};
