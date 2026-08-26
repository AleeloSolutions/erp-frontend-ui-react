import { JETBRAINS_MONO } from "./theme";

export interface InvoiceSealProps {
  /** e.g. "Invoice" */
  label: string;
  /** e.g. "2026 / 00010" */
  number: string;
  /** Shrinks the stamp for layouts with less room around it (e.g. inline with a title). Defaults to 118px, matching the reference. */
  size?: number;
}

/**
 * The rotated stamp-circle invoice number, replacing plain "Invoice #" text
 * on every layout. Colors are pulled entirely from `var(--ls-primary-70)` /
 * `var(--ls-primary-40a)`, inherited from the nearest `.ls-theme` ancestor
 * (see shared/theme.ts) — no color props needed.
 *
 * `select-none`: a purely decorative stamp — without it, a stray double-
 * click or drag-select over the label/number paints the browser's default
 * blue `::selection` highlight across the rotated text, which looks like a
 * rendering bug (a blue box clipped to each text line) rather than a
 * selection state.
 */
export function InvoiceSeal({ label, number, size = 118 }: InvoiceSealProps) {
  return (
    <div
      className="relative grid shrink-0 -rotate-[8deg] select-none place-items-center rounded-full shadow-lg"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 35% 30%, var(--ls-primary-70), var(--ls-primary))",
        boxShadow: "0 8px 20px var(--ls-primary-40a)",
      }}
    >
      <div className="absolute inset-[6px] rounded-full border-[1.5px] border-dashed border-white/45" />
      <div className="px-2.5 text-center leading-tight text-white">
        <span
          className="block text-[8.5px] uppercase tracking-[.14em] opacity-75"
          style={{ fontFamily: JETBRAINS_MONO }}
        >
          {label}
        </span>
        <span
          className="block text-[12.5px] font-medium"
          style={{ fontFamily: JETBRAINS_MONO }}
        >
          {number}
        </span>
      </div>
    </div>
  );
}
