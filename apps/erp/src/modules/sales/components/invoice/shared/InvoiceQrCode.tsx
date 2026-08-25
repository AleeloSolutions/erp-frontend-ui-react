import { QRCodeSVG } from "qrcode.react";

export interface InvoiceQrCodeProps {
  value: string;
  size?: number;
}

/**
 * Always rendered in plain black-on-white regardless of the invoice's brand
 * colors — QR scan reliability depends on contrast, so this intentionally
 * ignores `primaryColor`/`secondaryColor`.
 */
export function InvoiceQrCode({ value, size = 64 }: InvoiceQrCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={1}
      role="img"
      aria-label={`QR code for ${value}`}
    />
  );
}
