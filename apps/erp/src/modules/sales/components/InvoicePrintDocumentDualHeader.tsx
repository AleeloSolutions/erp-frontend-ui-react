import logoUrl from "@/modules/sales/assets/germany-ltd-logo.png";
import type { InvoicePrintDocumentBackgroundLine } from "./InvoicePrintDocumentBackground";

/**
 * Colors/shapes copied from a specific Odoo report theme (company `1`,
 * "dual header" layout) — hardcoded on purpose, this is a fixed external
 * design to replicate exactly, not a themeable in-app look. The two
 * decorative SVG paths (top wave, top-left triangle) are the exact paths
 * from the source markup; the body below the header (table/totals/footer)
 * was reconstructed from an actual rendered PDF of this layout since the
 * HTML paste itself got cut off after the header's logo.
 */
const palette = {
  orange: "#d16500",
  darkRed: "#881a07",
  border: "#d1d5db",
  amountBg: "#f4f4f6",
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

export interface InvoicePrintDocumentDualHeaderProps {
  invoice: {
    number: string;
    date: string;
    dueDate: string;
    customer: string;
    customerEmail?: string;
    paymentTerms?: string;
    accountNumber?: string;
    lines: InvoicePrintDocumentBackgroundLine[];
  };
}

export function InvoicePrintDocumentDualHeader({
  invoice,
}: InvoicePrintDocumentDualHeaderProps) {
  const untaxedAmount = invoice.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0
  );

  const taxGroups = new Map<number, number>();
  for (const line of invoice.lines) {
    if (!line.taxRate) continue;
    const base = line.quantity * line.unitPrice;
    taxGroups.set(line.taxRate, (taxGroups.get(line.taxRate) ?? 0) + base);
  }
  const taxLines = Array.from(taxGroups.entries()).map(([rate, base]) => ({
    rate,
    base,
    tax: base * (rate / 100),
  }));
  const total = untaxedAmount + taxLines.reduce((sum, t) => sum + t.tax, 0);

  return (
    <div
      className="relative mx-auto flex min-h-[297mm] max-w-[210mm] flex-col overflow-hidden bg-white text-black shadow-md print:max-w-none print:shadow-none"
      style={{ fontFamily: "Lato, sans-serif" }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <svg
        width="100%"
        height="60"
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0"
      >
        <path d="M0 0H1000V16L0 60Z" fill={palette.orange} fillOpacity={0.15} />
      </svg>
      <svg
        width="70"
        height="140"
        viewBox="0 0 80 160"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0"
      >
        <path d="M0 0H80L0 160Z" fill={palette.darkRed} fillOpacity={0.15} />
      </svg>

      <div className="relative z-10 px-[15mm] pt-6 print:px-[10mm]">
        <div className="flex items-start justify-between py-4">
          <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
          <div className="text-right text-[11px] leading-relaxed">
            <div>{company.address}</div>
            <div>Tax ID: {company.taxId}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-4">
          <div className="text-[12px]">{invoice.customer}</div>
          <h2
            className="text-right text-[1.35rem] font-normal"
            style={{ color: palette.orange }}
          >
            Invoice {invoice.number}
          </h2>
        </div>

        <div className="mb-6 mt-3 grid max-w-sm grid-cols-2 gap-4 text-[12px]">
          <div>
            <strong style={{ color: palette.darkRed }}>Invoice Date</strong>
            <div>{invoice.date}</div>
          </div>
          <div>
            <strong style={{ color: palette.darkRed }}>Due Date</strong>
            <div>{invoice.dueDate}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-[15mm] print:px-[10mm]">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b" style={{ borderColor: palette.border }}>
              <th className="py-2 text-left font-normal">Description</th>
              <th className="py-2 text-right font-normal">Quantity</th>
              <th className="py-2 text-right font-normal">Unit Price</th>
              <th className="py-2 text-right font-normal">Taxes</th>
              <th className="py-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr
                key={line.id}
                className="border-b"
                style={{ borderColor: palette.border }}
              >
                <td className="py-2">{line.description}</td>
                <td className="py-2 text-right">{line.quantity.toFixed(2)}</td>
                <td className="py-2 text-right">{line.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right">
                  {line.taxRate ? `${line.taxRate}%` : ""}
                </td>
                <td className="py-2 text-right">
                  {formatShillings(line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex">
          <div className="flex-1 pr-3 pt-3 text-[12px]">
            {invoice.paymentTerms ? (
              <div>Payment terms: {invoice.paymentTerms}</div>
            ) : null}
            <div className="mt-6">
              Payment Communication: <strong>{invoice.number}</strong>
            </div>
            {invoice.accountNumber ? (
              <div>
                on this account: <strong>{invoice.accountNumber}</strong>
              </div>
            ) : null}
          </div>
          <div className="w-64 shrink-0 border" style={{ borderColor: palette.border }}>
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                <tr
                  className="border-b"
                  style={{
                    borderColor: palette.border,
                    backgroundColor: palette.amountBg,
                  }}
                >
                  <td className="px-3 py-1.5">Untaxed Amount</td>
                  <td className="px-3 py-1.5 text-right">
                    {formatShillings(untaxedAmount)}
                  </td>
                </tr>
                {taxLines.map((t) => (
                  <tr
                    key={t.rate}
                    className="border-b"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.amountBg,
                    }}
                  >
                    <td className="px-3 py-1.5">
                      Tax {t.rate}% on {formatShillings(t.base)}
                    </td>
                    <td className="px-3 py-1.5 text-right">{formatShillings(t.tax)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: palette.amountBg }}>
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
        </div>
      </div>

      <div className="relative z-10 mt-auto px-[15mm] pb-8 pt-16 print:px-[10mm]">
        <div className="flex items-end justify-between">
          {invoice.customerEmail ? (
            <div
              className="text-[1.4rem] font-extrabold"
              style={{ color: palette.orange }}
            >
              {invoice.customerEmail}
            </div>
          ) : (
            <div />
          )}
          <div className="text-[12px] font-bold">{company.name}</div>
        </div>
        <div className="mt-2 text-center text-[10px]" style={{ color: palette.muted }}>
          Page 1 / 1
        </div>
      </div>
    </div>
  );
}
