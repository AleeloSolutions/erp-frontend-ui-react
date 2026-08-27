import type { ReactNode } from "react";
import { FRAUNCES } from "./theme";

export interface InvoiceSpineProps {
  /** Logo-initial letter(s) or a logo `<img>` — rendered inside the diamond mark. */
  mark?: ReactNode;
  primary: string;
  secondary: string;
  /**
   * `vertical` is the reference's running left rail. `horizontal` is this
   * layout's adaptation for a fully centered composition, where a left rail
   * would fight the centered arrangement — same rail texture and diamond
   * mark, laid along the top edge instead.
   */
  orientation?: "vertical" | "horizontal";
}

const stripeTexture =
  "repeating-linear-gradient(-45deg, rgba(255,255,255,.07) 0 2px, transparent 2px 9px)";

export function InvoiceSpine({
  mark,
  primary,
  secondary,
  orientation = "vertical",
}: InvoiceSpineProps) {
  const diamond = (
    <div
      className="grid h-[26px] w-[26px] select-none rotate-45 place-items-center shadow-md"
      style={{ backgroundColor: secondary }}
    >
      <span
        className="-rotate-45 text-[12px] font-semibold leading-none"
        style={{ fontFamily: FRAUNCES, color: primary }}
      >
        {mark}
      </span>
    </div>
  );

  if (orientation === "horizontal") {
    return (
      <div
        className="relative h-5 w-full shrink-0 overflow-hidden print:h-4"
        style={{ backgroundColor: primary }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: stripeTexture }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {diamond}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-5 shrink-0 overflow-hidden print:w-4"
      style={{ backgroundColor: primary }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: stripeTexture }} />
      {/* <div className="absolute left-1/2 top-[34px] -translate-x-1/2">{diamond}</div> */}
    </div>
  );
}
