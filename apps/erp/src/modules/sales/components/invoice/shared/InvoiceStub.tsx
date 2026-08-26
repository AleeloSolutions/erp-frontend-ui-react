import type { InvoiceData } from "../types/invoice";
import { JETBRAINS_MONO } from "./theme";

export interface InvoiceStubProps {
  totals: InvoiceData["totals"];
  primary: string;
}

function formatAmount(value: number, currencySuffix: string): string {
  return `${value.toFixed(2)} ${currencySuffix}`;
}

/**
 * Ticket-stub totals card — replaces `InvoiceTotals` as the one totals
 * treatment shared by all three layouts, regardless of which table style is
 * active (the reference pairs `.stub` with `.terms` at the layout level, not
 * per table style). The torn top edge is a scalloped `radial-gradient`
 * background, matching the reference's `.stub-torn` trick exactly.
 */
export function InvoiceStub({ totals, primary }: InvoiceStubProps) {
  return (
    <div className="w-[260px] shrink-0">
      <div
        className="h-2"
        style={{
          backgroundImage: "radial-gradient(circle at 6px 0, transparent 5px, white 5px)",
          backgroundSize: "12px 8px",
          backgroundPosition: "left top",
        }}
        aria-hidden
      />
      <div
        className="border-l border-r px-4 py-2"
        style={{ borderColor: "var(--ls-line)", backgroundColor: "var(--ls-paper-tint)" }}
      >
        <div
          className="flex justify-between py-0.5 text-[12px]"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          <span>Untaxed amount</span>
          <b
            style={{
              color: "var(--ls-ink)",
              fontFamily: JETBRAINS_MONO,
              fontWeight: 500,
            }}
          >
            {formatAmount(totals.untaxedAmount, totals.currencySuffix)}
          </b>
        </div>
        {totals.taxLines.map((t) => (
          <div
            key={t.rate}
            className="flex justify-between py-0.5 text-[12px]"
            style={{ color: "var(--ls-ink-soft)" }}
          >
            <span>
              Tax {t.rate}% on {formatAmount(t.base, totals.currencySuffix)}
            </span>
            <b
              style={{
                color: "var(--ls-ink)",
                fontFamily: JETBRAINS_MONO,
                fontWeight: 500,
              }}
            >
              {formatAmount(t.tax, totals.currencySuffix)}
            </b>
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between rounded-b-lg px-4 py-2 text-white"
        style={{ backgroundColor: primary }}
      >
        <span className="text-[11px] uppercase tracking-[.06em] opacity-85">Total</span>
        <span className="text-[16px] font-medium" style={{ fontFamily: JETBRAINS_MONO }}>
          {formatAmount(totals.total, totals.currencySuffix)}
        </span>
      </div>
    </div>
  );
}
