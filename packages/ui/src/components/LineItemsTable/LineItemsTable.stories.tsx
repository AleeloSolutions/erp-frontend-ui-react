import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { X } from "lucide-react";
import { Dropdown, type DropdownItem } from "../Dropdown";
import { Input } from "../../primitives/Input";
import { Textarea } from "../../primitives/Textarea";
import {
  LineItemsTable,
  type LineItemsColumn,
  type LineItemsRowHelpers,
  type LineItemsSpecialRow,
} from "./LineItemsTable";

interface InvoiceLine {
  id: string;
  kind: "product" | "section" | "note";
  product: string;
  description: string;
  account: string;
  quantity: number;
  price: number;
  taxRate: number;
  /** Free text for section/note rows. */
  text: string;
}

let nextId = 1;
const makeId = () => `new-${nextId++}`;

const productItems: DropdownItem[] = [
  { key: "[FEE] Service Fee", label: "[FEE] Service Fee" },
  {
    key: "[DELIVERY] Delivery Fee (Self-order)",
    label: "[DELIVERY] Delivery Fee (Self-order)",
  },
  { key: "[TIPS] Tips", label: "[TIPS] Tips" },
  { key: "Consulting Services", label: "Consulting Services" },
];

const accountItems: DropdownItem[] = [
  { key: "400000 Product Sales", label: "400000 Product Sales" },
  { key: "400010 Service Revenue", label: "400010 Service Revenue" },
  { key: "400020 Discounts", label: "400020 Discounts" },
];

function productRow(overrides: Partial<InvoiceLine>): InvoiceLine {
  return {
    id: makeId(),
    kind: "product",
    product: "",
    description: "",
    account: "400000 Product Sales",
    quantity: 1,
    price: 0,
    taxRate: 15,
    text: "",
    ...overrides,
  };
}

const initialLines: InvoiceLine[] = [
  productRow({
    id: "l1",
    product: "[FEE] Service Fee",
    quantity: 2,
    price: 0,
    taxRate: 0,
  }),
  {
    id: "s1",
    kind: "section",
    product: "",
    description: "",
    account: "",
    quantity: 0,
    price: 0,
    taxRate: 0,
    text: "Delivery & tips",
  },
  productRow({
    id: "l2",
    product: "[DELIVERY] Delivery Fee (Self-order)",
    quantity: 2,
    price: 0,
    taxRate: 15,
  }),
  {
    id: "n1",
    kind: "note",
    product: "",
    description: "",
    account: "",
    quantity: 0,
    price: 0,
    taxRate: 0,
    text: "Tips are shared evenly across the delivery team.",
  },
  productRow({
    id: "l3",
    product: "[TIPS] Tips",
    quantity: 3,
    price: 1,
    taxRate: 0,
  }),
];

function lineAmount(row: InvoiceLine) {
  return row.quantity * row.price;
}

/** Odoo behavior: a section subtotals every product row below it, down to the next section (or the end). */
function sectionSubtotal(sectionRow: InvoiceLine, allRows: InvoiceLine[]) {
  const startIndex = allRows.findIndex((row) => row.id === sectionRow.id);
  let sum = 0;
  for (let i = startIndex + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (row.kind === "section") break;
    if (row.kind === "product") sum += lineAmount(row);
  }
  return sum;
}

function InvoiceLinesDemo() {
  const [rows, setRows] = useState<InvoiceLine[]>(initialLines);
  const [lastCommitted, setLastCommitted] = useState<string>("—");

  const columns: LineItemsColumn<InvoiceLine>[] = [
    {
      key: "product",
      label: "Product",
      size: 320,
      minSize: 200,
      maxSize: 520,
      renderCell: (row, { onChange, onCommit }) => (
        <div className="flex flex-col gap-0.5">
          <Dropdown
            trigger="field"
            searchable
            allowFreeText
            hideChevron
            chrome="cell"
            placeholder="Search a product"
            value={row.product || null}
            items={productItems}
            className="font-bold"
            onChange={(key) => {
              onChange({ product: key ?? "" });
              onCommit();
            }}
          />
          <Textarea
            autoGrow
            chrome="cell"
            value={row.description}
            placeholder="Enter a description"
            className="text-[11px] italic text-erp-muted"
            onChange={(e) => onChange({ description: e.target.value })}
            onBlur={onCommit}
          />
        </div>
      ),
    },
    {
      key: "account",
      label: "Account",
      size: 220,
      minSize: 140,
      maxSize: 360,
      renderCell: (row, { onChange, onCommit }) => (
        <Dropdown
          trigger="field"
          searchable
          allowFreeText
          chrome="cell"
          value={row.account || null}
          items={accountItems}
          onChange={(key) => {
            onChange({ account: key ?? "" });
            onCommit();
          }}
        />
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "end",
      size: 90,
      minSize: 70,
      maxSize: 140,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          type="number"
          chrome="cell"
          className="text-end"
          value={row.quantity}
          onChange={(e) => onChange({ quantity: Number(e.target.value) })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "price",
      label: "Price",
      align: "end",
      size: 90,
      minSize: 70,
      maxSize: 140,
      renderCell: (row, { onChange, onCommit }) => (
        <Input
          type="number"
          chrome="cell"
          className="text-end"
          value={row.price}
          onChange={(e) => onChange({ price: Number(e.target.value) })}
          onBlur={onCommit}
        />
      ),
    },
    {
      key: "taxes",
      label: "Taxes",
      size: 110,
      minSize: 80,
      maxSize: 180,
      renderCell: (row, { onChange, onCommit }) =>
        row.taxRate > 0 ? (
          <span className="inline-flex h-[18px] items-center gap-1 rounded-full bg-erp-header pl-1.5 pr-1 text-[9px] font-bold tracking-[0.02em] text-erp-muted">
            {row.taxRate}%
            <button
              type="button"
              aria-label="Remove tax"
              className="rounded-full hover:bg-erp-surface-hover"
              onClick={() => {
                onChange({ taxRate: 0 });
                onCommit();
              }}
            >
              <X className="h-2.5 w-2.5" aria-hidden />
            </button>
          </span>
        ) : null,
    },
    {
      key: "amount",
      label: "Amount",
      align: "end",
      size: 110,
      minSize: 80,
      maxSize: 180,
      hideable: false,
      renderCell: (row) => (
        <span className="font-bold">{lineAmount(row).toFixed(2)}&nbsp;Sh.</span>
      ),
    },
  ];

  const getSpecialRow = (
    row: InvoiceLine,
    { onChange, onCommit }: LineItemsRowHelpers<InvoiceLine>
  ): LineItemsSpecialRow | undefined => {
    if (row.kind === "section") {
      return {
        content: (
          <Textarea
            autoGrow
            chrome="cell"
            value={row.text}
            placeholder="Section"
            className="font-bold"
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onCommit}
          />
        ),
        trailingCells: [
          <span key="amount" className="font-bold">
            {sectionSubtotal(row, rows).toFixed(2)}&nbsp;Sh.
          </span>,
        ],
      };
    }
    if (row.kind === "note") {
      return {
        content: (
          <Textarea
            autoGrow
            chrome="cell"
            value={row.text}
            placeholder="Note"
            className="italic text-erp-muted"
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onCommit}
          />
        ),
      };
    }
    return undefined;
  };

  return (
    <div className="max-w-5xl">
      <LineItemsTable<InvoiceLine>
        tableId="storybook-invoice-lines"
        columns={columns}
        rows={rows}
        onRowsChange={setRows}
        onCommitRow={(row) => setLastCommitted(`${row.id}: saved`)}
        getSpecialRow={getSpecialRow}
        createEmptyRow={() => productRow({})}
        secondaryFooterActions={[
          {
            key: "section",
            label: "Add a section",
            onClick: () =>
              setRows((prev) => [
                ...prev,
                { ...productRow({}), kind: "section", text: "" },
              ]),
          },
          {
            key: "note",
            label: "Add a note",
            onClick: () =>
              setRows((prev) => [...prev, { ...productRow({}), kind: "note", text: "" }]),
          },
          { key: "catalog", label: "Catalog", onClick: () => {} },
        ]}
        aria-label="Invoice lines"
      />
      <p className="mt-3 text-[11px] text-erp-muted">
        Last committed on field save ("save on key leave"): {lastCommitted}
      </p>
    </div>
  );
}

const meta = {
  title: "Components/LineItemsTable",
  component: LineItemsTable,
} satisfies Meta<typeof LineItemsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InvoiceLines: Story = {
  render: () => <InvoiceLinesDemo />,
};
