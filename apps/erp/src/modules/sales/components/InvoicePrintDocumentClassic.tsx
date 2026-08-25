import logoUrl from "@/modules/sales/assets/germany-ltd-logo.png";
import type { InvoiceLine } from "@/modules/sales/api";

/** Colors/layout copied verbatim from a specific Odoo report theme (company `NewId_0x7a896fca8a00`, "striped" layout) — hardcoded on purpose, this is a fixed external design to replicate exactly, not a themeable in-app look. */
const palette = {
  orange: "#d16500",
  darkRed: "#881a07",
  stripe: "#f3e8e6",
  headerBg: "#faf0e6",
  muted: "#6b7280",
};

const company = {
  name: "Germany LTD.",
  address: "Somalia",
  taxId: "978897",
};

function formatShillings(value: number): string {
  return `${value.toFixed(2)} Sh.`;
}

export interface InvoicePrintDocumentClassicProps {
  invoice: {
    number: string;
    date: string;
    dueDate: string;
    customer: string;
    customerEmail?: string;
    notes?: string;
    lines: InvoiceLine[];
  };
}

export function InvoicePrintDocumentClassic({
  invoice,
}: InvoicePrintDocumentClassicProps) {
  const total = invoice.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0
  );
  const lastLineId = invoice.lines[invoice.lines.length - 1]?.id;

  return (
    <div
      className="mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white text-black shadow-md print:max-w-none print:shadow-none"
      style={{ fontFamily: "Lato, sans-serif" }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <div
        className="grid grid-cols-3 items-start gap-4 px-[15mm] py-6 print:px-[10mm]"
        style={{ backgroundColor: palette.headerBg }}
      >
        <ul className="m-0 list-none p-0 text-[11px] leading-relaxed">
          <li>{company.address}</li>
          <li>
            <span>Tax ID</span>: <span>{company.taxId}</span>
          </li>
        </ul>
        <div className="text-center">
          <img
            src={logoUrl}
            alt="Logo"
            className="mx-auto mb-1 h-16 w-16 object-contain"
          />
        </div>
        <div className="text-right text-[12px]">{invoice.customer}</div>
      </div>

      <div className="px-[15mm] print:px-[10mm]">
        <h2
          className="mb-4 mt-6 text-[1.75rem] font-normal"
          style={{ color: palette.orange }}
        >
          Invoice {invoice.number}
        </h2>

        <div className="mb-6 grid grid-cols-2 gap-4 text-[12px]">
          <div>
            <strong style={{ color: palette.darkRed }}>Invoice Date</strong>
            <div>{invoice.date}</div>
          </div>
          <div>
            <strong style={{ color: palette.darkRed }}>Due Date</strong>
            <div>{invoice.dueDate}</div>
          </div>
        </div>

        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ borderBottom: `2px solid ${palette.darkRed}` }}>
              <th
                className="py-1.5 text-left font-bold"
                style={{ color: palette.darkRed }}
              >
                Description
              </th>
              <th
                className="py-1.5 text-right font-bold"
                style={{ color: palette.darkRed }}
              >
                Quantity
              </th>
              <th
                className="py-1.5 text-right font-bold"
                style={{ color: palette.darkRed }}
              >
                Unit Price
              </th>
              <th
                className="py-1.5 text-right font-bold"
                style={{ color: palette.darkRed }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr
                key={line.id}
                style={{
                  backgroundColor: index % 2 === 0 ? palette.stripe : undefined,
                  borderBottom:
                    line.id === lastLineId ? `2px solid ${palette.darkRed}` : undefined,
                }}
              >
                <td className="py-1.5">{line.description}</td>
                <td className="py-1.5 text-right">{line.quantity.toFixed(2)}</td>
                <td className="py-1.5 text-right">{formatShillings(line.unitPrice)}</td>
                <td className="py-1.5 text-right">
                  {formatShillings(line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="text-[12px]">
            <tbody>
              <tr style={{ backgroundColor: palette.stripe }}>
                <td className="px-3 py-1.5 font-bold" style={{ color: palette.orange }}>
                  Total
                </td>
                <td
                  className="px-3 py-1.5 text-right font-bold"
                  style={{ color: palette.orange }}
                >
                  {formatShillings(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[12px]">
          Payment Communication: <strong>{invoice.number}</strong>
        </p>

        {/* {invoice.notes ? (
          <p
            className="mt-2 flex items-center gap-1 text-[11px]"
            style={{ color: palette.muted }}
          >
            <Tag className="h-3 w-3" aria-hidden />
            {invoice.notes}
          </p>
        ) : null} */}
      </div>

      <div className="mt-auto px-[15mm] pb-8 pt-16 text-center print:px-[10mm]">
        {invoice.customerEmail ? (
          <div className="text-[1.4rem] font-extrabold" style={{ color: palette.orange }}>
            {invoice.customerEmail}
          </div>
        ) : null}
        <div className="mt-2 text-[10px]" style={{ color: palette.muted }}>
          Page 1 / 1
        </div>
      </div>
    </div>
  );
}
