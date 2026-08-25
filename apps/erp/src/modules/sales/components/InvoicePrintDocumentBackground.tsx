import logoUrl from "@/modules/sales/assets/germany-ltd-logo.png";

/**
 * Colors/layout copied from a specific Odoo report theme (company
 * `NewId_0x7a8963129800`, "Background" layout) — hardcoded on purpose,
 * this is a fixed external design to replicate exactly, not a themeable
 * in-app look.
 *
 * The decorative shapes (top header wave, bottom-left corner accent) are a
 * hand-tuned approximation — the source only gave a rendered PDF, not the
 * original SVG bezier path, so this uses simple circles/ellipses sized and
 * positioned to look right rather than matching the exact curve.
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

export interface InvoicePrintDocumentBackgroundLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Percent, e.g. 15 for 15%. Omit/0 for an untaxed line. */
  taxRate?: number;
}

export interface InvoicePrintDocumentBackgroundProps {
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

export function InvoicePrintDocumentBackground({
  invoice,
}: InvoicePrintDocumentBackgroundProps) {
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
        width="360"
        height="360"
        viewBox="0 0 1100 1100"
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{ right: "-160px", top: "-200px" }}
      >
        <circle cx="550" cy="550" r="550" fill={palette.orange} fillOpacity={0.12} />
      </svg>

      <div className="relative z-10 px-[15mm] pt-6 print:px-[10mm]">
        <div className="flex items-start justify-between">
          <div className="text-[13px] font-bold">{company.name}</div>
          <div className="flex flex-col items-end gap-1.5">
            <img src={logoUrl} alt="Logo" className="h-9 w-9 object-contain" />
            <div className="text-right text-[11px] leading-relaxed">
              <div>{company.address}</div>
              <div>Tax ID: {company.taxId}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-start justify-between gap-4">
          <div className="text-[12px]">{invoice.customer}</div>
          <h2
            className="text-right text-[1.75rem] font-normal"
            style={{ color: palette.orange }}
          >
            Invoice {invoice.number}
          </h2>
        </div>

        <div className="mb-6 mt-4 grid max-w-sm grid-cols-2 gap-4 text-[12px]">
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
        <div className="overflow-hidden text-[12px]">
          <table
            className="w-full border-collapse border"
            style={{ borderColor: palette.border }}
          >
            <thead>
              <tr className="border-b" style={{ borderColor: palette.border }}>
                <th className="px-3 py-2 text-left font-normal">Description</th>
                <th
                  className="border-l px-3 py-2 text-right font-normal"
                  style={{ borderColor: palette.border }}
                >
                  Quantity
                </th>
                <th
                  className="border-l px-3 py-2 text-right font-normal"
                  style={{ borderColor: palette.border }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b"
                  style={{ borderColor: palette.border }}
                >
                  <td className="px-3 py-2">{line.description}</td>
                  <td
                    className="border-l px-3 py-2 text-right"
                    style={{ borderColor: palette.border }}
                  >
                    {line.quantity.toFixed(2)}
                  </td>
                  <td
                    className="border-l px-3 py-2 text-right"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.amountBg,
                    }}
                  >
                    {formatShillings(line.quantity * line.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex">
            <div className="flex-1 p-3">
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
            <div className="w-64 shrink-0" style={{ borderColor: palette.border }}>
              <table
                className="w-full border-collapse border"
                style={{ borderColor: palette.border }}
              >
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
                    <td
                      className="px-3 py-1.5 font-bold"
                      style={{ color: palette.orange }}
                    >
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
      </div>

      <div className="relative z-10 mt-auto px-[15mm] pb-8 pt-16 text-center print:px-[10mm]">
        <svg
          width="360"
          height="360"
          viewBox="0 0 1100 1100"
          aria-hidden
          className="pointer-events-none absolute z-0"
          style={{ left: "-160px", bottom: "-200px" }}
        >
          <circle cx="550" cy="550" r="550" fill={palette.orange} fillOpacity={0.12} />
        </svg>

        <div className="relative">
          {invoice.customerEmail ? (
            <div
              className="text-[1.4rem] font-extrabold"
              style={{ color: palette.orange }}
            >
              {invoice.customerEmail}
            </div>
          ) : null}
          <div className="mt-2 text-[10px]" style={{ color: palette.muted }}>
            Page 1 / 1
          </div>
        </div>
      </div>
    </div>
  );
}
