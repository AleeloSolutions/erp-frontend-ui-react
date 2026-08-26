import { InvoiceQrCode } from "./InvoiceQrCode";
import { JETBRAINS_MONO } from "./theme";
import type { TableStylePaymentInfo } from "../tables/types";

/**
 * Payment terms / communication / account lines plus the "scan to pay" QR
 * block, stacked in that order (matches `.foot-row .terms` in the Ledger
 * Seal reference). Renders as a fragment (no wrapping element) so each
 * layout's own foot-row `<div>` keeps controlling padding/width. Identifier
 * values (reference, account number) use JetBrains Mono, matching the
 * reference's "mono for every numeric/id value" rule.
 */
export interface InvoicePaymentInfoProps {
  paymentInfo?: TableStylePaymentInfo;
  qrValue?: string;
  mutedColor?: string;
}

export function InvoicePaymentInfo({
  paymentInfo,
  qrValue,
  mutedColor = "var(--ls-ink-soft)",
}: InvoicePaymentInfoProps) {
  return (
    <>
      {paymentInfo?.paymentTerms ? (
        <div style={{ color: mutedColor }}>
          Payment terms:{" "}
          <strong style={{ color: "var(--ls-ink)" }}>{paymentInfo.paymentTerms}</strong>
        </div>
      ) : null}
      {paymentInfo?.paymentReference ? (
        <div className="mt-2" style={{ color: mutedColor }}>
          Payment communication:{" "}
          <strong style={{ fontFamily: JETBRAINS_MONO, color: "var(--ls-ink)" }}>
            {paymentInfo.paymentReference}
          </strong>
        </div>
      ) : null}
      {paymentInfo?.accountNumber ? (
        <div style={{ color: mutedColor }}>
          On this account:{" "}
          <strong style={{ fontFamily: JETBRAINS_MONO, color: "var(--ls-ink)" }}>
            {paymentInfo.accountNumber}
          </strong>
        </div>
      ) : null}
      {qrValue ? (
        // `float` instead of `flex` here: this exact pairing (an SVG beside
        // text in a flex row) was observed rendering correctly on screen but
        // stacking vertically in Chrome's print/PDF pipeline. Floats are a
        // much older, more reliably-supported technique for print rendering.
        <div className="mt-2 overflow-hidden">
          <div className="float-left mr-2" style={{ width: 48, height: 48 }}>
            <InvoiceQrCode value={qrValue} size={48} />
          </div>
          <div className="text-[9px] italic leading-tight" style={{ color: mutedColor }}>
            Scan this QR code with
            <br />
            your banking application
          </div>
        </div>
      ) : null}
    </>
  );
}
