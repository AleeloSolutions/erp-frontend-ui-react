import { cn } from "../../utils";

export type StatusStep = {
  key: string;
  label: string;
};

export interface StatusStepperProps {
  steps: StatusStep[];
  currentStepKey: string;
  className?: string;
  "aria-label"?: string;
}

const NOTCH = 10;

/**
 * Each segment's own clip-path fully describes its true visible shape —
 * a point on the right (unless last) AND a matching notch cut into the left
 * (unless first) — so adjacent segments interlock by sitting flush next to
 * each other, no overlap/z-index trick required. That matters for the
 * active segment's border (see below): since the shape is the segment's
 * real outline on every side, a border traced along it is correct
 * regardless of whether the active step is first, in the middle, or last.
 */
function segmentClipPath(isFirst: boolean, isLast: boolean): string | undefined {
  if (isFirst && isLast) return undefined;

  const rightPoint = `calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%`;
  const leftNotch = `${NOTCH}px 50%`;

  if (isFirst) return `polygon(0 0, ${rightPoint}, 0 100%)`;
  if (isLast) return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${leftNotch})`;
  return `polygon(0 0, ${rightPoint}, 0 100%, ${leftNotch})`;
}

/**
 * Odoo-style status breadcrumb ("Draft ❯ Posted"): interlocking arrow
 * segments in a pill.
 *
 * Markup mirrors Odoo's real `o_statusbar_status` widget: a `radiogroup` of
 * `radio` buttons (`disabled` — read-only, `aria-checked`/`data-value` per
 * step) rather than plain decorative spans, even though nothing is
 * clickable yet.
 */
export function StatusStepper({
  steps,
  currentStepKey,
  className,
  "aria-label": ariaLabel = "Statusbar",
}: StatusStepperProps) {
  if (steps.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex overflow-hidden border border-erp-border shadow-sm rtl:-scale-x-100",
        className
      )}
    >
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isActive = step.key === currentStepKey;
        const clipPath = segmentClipPath(isFirst, isLast);

        return (
          <button
            key={step.key}
            type="button"
            role="radio"
            disabled
            aria-checked={isActive}
            aria-current={isActive ? "step" : undefined}
            data-value={step.key}
            style={{
              clipPath,
              // A hairline overlap, not a real gap between segments: at this exact
              // seam two independently clip-path'd elements meet, and sub-pixel
              // anti-aliasing on the point/notch tips can let the container's
              // background peek through. 1px of overlap (plus stacking order so
              // the earlier segment's tip paints on top) hides that without
              // affecting each segment's own correct shape/border.
              marginLeft: isFirst ? undefined : -1,
              zIndex: steps.length - index,
            }}
            className={cn(
              // Same box model as Button (px-[0.625rem] py-[0.3125rem] text-[0.875rem]
              // font-[500] leading-[1.5]) since real Odoo's arrow buttons literally
              // share the .btn class with the statusbar's Confirm/Cancel buttons.
              "relative inline-flex appearance-none items-center whitespace-nowrap px-[0.625rem] py-[0.3125rem] text-[0.875rem] font-[500] leading-[1.5] disabled:cursor-default disabled:opacity-100",
              !isLast && "pr-[18px]",
              !isFirst && "pl-[18px]",
              isActive
                ? // Same look as Button's outline variant (border + text in the primary
                  // color), minus the hover/active states — this is a static, disabled
                  // display, not an interactive control. The button itself is filled
                  // with the border color; the inset span below draws the actual
                  // table-selected fill 1px in, tracing the same clip-path so the
                  // "border" follows every notch/point edge instead of stopping dead
                  // at them (plain CSS `border` can't follow a clip-path cut).
                  "bg-erp-primary text-erp-primary"
                : "border-0 bg-erp-secondary text-erp-secondary-foreground"
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-[1px] bg-erp-table-selected"
                style={{ clipPath }}
              />
            ) : null}
            {/* Un-mirror the label since the segment shape is flipped for RTL above (rule: chevrons that convey direction flip, but text must stay readable). */}
            <span className="relative rtl:-scale-x-100">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
