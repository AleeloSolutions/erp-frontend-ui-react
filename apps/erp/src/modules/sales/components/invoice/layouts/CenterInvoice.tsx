import type { InvoiceData, InvoiceSettings } from "../types/invoice";
import { InvoiceLogoBadge } from "../shared/InvoiceLogoBadge";
import { InvoicePaymentInfo } from "../shared/InvoicePaymentInfo";
import {
  LEDGER_SEAL_THEME_CSS,
  ledgerSealThemeVars,
  FRAUNCES,
  JETBRAINS_MONO,
} from "../shared/theme";
import { companyInitials } from "../lib/companyInitials";
import { tableStyles } from "../config/tableStyles";
import { buildInvoiceQrValue } from "../lib/buildQrValue";

/**
 * "Simple" skin — one content column (matches Bubble/Dual's single
 * `flex-1 flex-col` wrapper, not a separate flex-1 middle div plus a
 * footer-as-root-sibling): left-anchored logo/company block with the
 * invoice number right-aligned beside it, a 4-field info strip, the
 * (untouched) table, a terms/totals foot row, and a company-name/
 * page-number footer pinned to the bottom via `mt-auto` on that last
 * child — same trick Bubble's shared `InvoiceFooter` uses internally.
 */
export interface CenterInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

function InfoField({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-[.07em] text-black">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12px] font-medium">{value}</div>
      {sub ? (
        <div
          className="truncate text-[11px] leading-snug"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Flat totals list matching the reference's `.sp-totals` — plain rows (no
 * ticket-stub box or colored bar, unlike the shared `InvoiceStub` other
 * layouts use), a top rule above the total, and the total row in the
 * primary brand color.
 */
function TotalsBox({
  totals,
  primary,
}: {
  totals: InvoiceData["totals"];
  primary: string;
}) {
  const format = (value: number) => `${value.toFixed(2)} ${totals.currencySuffix}`;

  return (
    <div className="w-[260px] shrink-0 text-[12px]">
      <div className="flex justify-between py-1" style={{ color: "var(--ls-ink-soft)" }}>
        <span>Untaxed amount</span>
        <b style={{ color: "var(--ls-ink)" }}>{format(totals.untaxedAmount)}</b>
      </div>
      {totals.taxLines.map((t) => (
        <div
          key={t.rate}
          className="flex justify-between py-1"
          style={{ color: "var(--ls-ink-soft)" }}
        >
          <span>
            Tax {t.rate}% on {format(t.base)}
          </span>
          <b style={{ color: "var(--ls-ink)" }}>{format(t.tax)}</b>
        </div>
      ))}
      <div
        className="mt-1 flex justify-between border-t-2 pt-2 text-[15px] font-bold"
        style={{ borderColor: primary, color: primary }}
      >
        <span>Total</span>
        <span>{format(totals.total)}</span>
      </div>
    </div>
  );
}

export function CenterInvoice({ data, settings }: CenterInvoiceProps) {
  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const logoUrl = settings.logoUrl ?? data.company.logoUrl;
  const address = settings.address || data.company.address;
  const accountNumber = settings.bankAccount || data.invoice.accountNumber;
  const companyName = settings.tagline || data.company.name;
  const Table = tableStyles[settings.tableStyle].component;

  return (
    <div
      className="ls-theme mx-auto flex w-[210mm] min-h-[297mm] shrink-0 bg-white shadow-md print:w-auto print:shadow-none"
      style={{
        fontFamily: settings.font,
        color: "var(--ls-ink)",
        ...ledgerSealThemeVars(primary, secondary),
      }}
    >
      <style>{"@page { size: A4; margin: 0; }"}</style>
      <style>{LEDGER_SEAL_THEME_CSS}</style>
      {/* border-bottom: 2px solid var(--brand-primary); */}
      <div className="flex min-w-0 flex-1 flex-col px-11 pb-2 pt-8 print:px-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b-[2px] border-erp-primary">
          <div className="flex min-w-0 items-center gap-3">
            <InvoiceLogoBadge
              logoUrl={logoUrl}
              initials={companyInitials(data.company.name)}
            />
            <div className="min-w-0">
              <div
                className="truncate text-[16px] font-semibold"
                style={{ fontFamily: FRAUNCES }}
              >
                {companyName}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div
              className="text-[13px] font-semibold"
              style={{ fontFamily: JETBRAINS_MONO }}
            >
              {data.invoice.number}
            </div>
            {data.invoice.dueDate ? (
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--ls-ink-soft)" }}>
                Due {data.invoice.dueDate}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-[22px] flex justify-between gap-4">
          <InfoField label="Billed to" value={data.customer.name} sub={address} />
          <InfoField label="Invoice date" value={data.invoice.date} />
          <InfoField label="Due date" value={data.invoice.dueDate ?? "—"} />
          <InfoField label="Terms" value={data.invoice.paymentTerms ?? "—"} />
        </div>

        <div className="mt-4">
          <Table
            items={data.items}
            currencySuffix={data.totals.currencySuffix}
            accentColor={primary}
            secondaryColor={secondary}
          />
        </div>

        <div className="mt-[22px] flex justify-between gap-6 text-[11.5px]">
          <div className="min-w-0 flex-1">
            <InvoicePaymentInfo
              paymentInfo={{
                paymentReference: data.invoice.paymentReference ?? data.invoice.number,
                accountNumber,
              }}
              qrValue={settings.showQrCode ? buildInvoiceQrValue(data) : undefined}
            />
          </div>
          <TotalsBox totals={data.totals} primary={primary} />
        </div>

        <div
          className="mt-auto flex items-center justify-between border-t pb-2 pt-2 text-[11px]"
          style={{ borderColor: "var(--ls-line)" }}
        >
          <span className="font-medium">{companyName}</span>
          <span style={{ color: "var(--ls-ink-soft)" }}>Page 1 / 1</span>
        </div>
      </div>
    </div>
  );
}
