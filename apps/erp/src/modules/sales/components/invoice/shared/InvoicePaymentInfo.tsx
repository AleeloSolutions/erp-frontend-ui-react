import { InvoiceQrCode } from "./InvoiceQrCode";
import type { TableStylePaymentInfo } from "../tables/types";

const defaultMuted = "#6b7280";

/**
 * Payment terms / communication / account lines plus the "scan to pay" QR
 * block, stacked in that order to match the Odoo reference layout exactly.
 * Renders as a fragment (no wrapping element) so every table style's own
 * wrapper `<div>` keeps controlling padding/width, matching how this block
 * was inlined per-style before it was shared.
 */
export interface InvoicePaymentInfoProps {
  paymentInfo?: TableStylePaymentInfo;
  qrValue?: string;
  mutedColor?: string;
}

export function InvoicePaymentInfo({
  paymentInfo,
  qrValue,
  mutedColor = defaultMuted,
}: InvoicePaymentInfoProps) {
  return (
    <>
      {paymentInfo?.paymentTerms ? (
        <div>Payment terms: {paymentInfo.paymentTerms}</div>
      ) : null}
      {paymentInfo?.paymentReference ? (
        <div className="mt-6">
          Payment Communication: <strong>{paymentInfo.paymentReference}</strong>
        </div>
      ) : null}
      {paymentInfo?.accountNumber ? (
        <div>
          on this account: <strong>{paymentInfo.accountNumber}</strong>
        </div>
      ) : null}
      {qrValue ? (
        <div className="mt-3 flex items-center gap-2">
          <InvoiceQrCode value={qrValue} size={56} />
          <div className="text-[9px] italic leading-tight" style={{ color: mutedColor }}>
            Scan this QR Code with
            <br />
            your banking application
          </div>
        </div>
      ) : null}
    </>
  );
}
