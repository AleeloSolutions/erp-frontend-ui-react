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
 * Odoo-style status breadcrumb ("Draft ❯ Posted"): interlocking arrow
 * segments in a pill. Each non-last segment is clipped to a point on its
 * right edge; the next segment tucks under that point via negative margin
 * and a higher z-index on the earlier segment, which reads as a shared
 * angled seam without needing to clip the left edge too.
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
        const clipPath = isLast
          ? undefined
          : `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%)`;

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
              zIndex: steps.length - index,
              marginLeft: isFirst ? undefined : -NOTCH,
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
                  // "border" follows the notch's diagonal edge instead of stopping
                  // dead at it (plain CSS `border` can't follow a clip-path cut).
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
