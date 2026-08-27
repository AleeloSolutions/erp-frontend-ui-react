import { FRAUNCES } from "./theme";

export interface InvoiceLogoBadgeProps {
  logoUrl?: string;
  initials: string;
  size?: number;
}

/**
 * Rounded-square logo slot (`.logo-slot` in the reference) — the image when
 * uploaded, initials otherwise. The image gets explicit pixel width/height
 * (not `h-full w-full`) — Chrome's print pipeline was observed rendering a
 * percentage-sized `<img>` at its full intrinsic size instead of the
 * constrained badge size, even though `overflow-hidden` is set on the
 * parent; fixed pixel dimensions sidestep that entirely.
 */
export function InvoiceLogoBadge({
  logoUrl,
  initials,
  size = 46,
}: InvoiceLogoBadgeProps) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl text-white"
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          width={size}
          height={size}
          className="object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span style={{ fontFamily: FRAUNCES, fontWeight: 600, fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
