import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../utils";

export type StatusStep = {
  key: string;
  label: string;
};

export interface StatusStepperProps {
  steps: StatusStep[];
  currentStepKey: string;
  onStepChange?: (key: string) => void;
  className?: string;
  "aria-label"?: string;
}

const NOTCH = 10;
const HEIGHT = 32;

/** Each segment's own SVG path fully describes its true visible shape — a
 * chevron point on the right (unless last) and a matching notch on the left
 * (unless first) — computed from the button's real rendered width so the
 * point/notch geometry stays exact at any label length. `undefined` for a
 * lone step (both first and last), which needs no cut at all. */
function segmentPath(width: number, isFirst: boolean, isLast: boolean): string | undefined {
  if (isFirst && isLast) return undefined;
  if (width <= 0) return undefined;

  const tip = `${width - NOTCH} 0 L ${width} ${HEIGHT / 2} L ${width - NOTCH} ${HEIGHT}`;
  const notch = `${NOTCH} ${HEIGHT / 2}`;

  if (isFirst) return `M 0 0 L ${tip} L 0 ${HEIGHT} Z`;
  if (isLast) return `M 0 0 L ${width} 0 L ${width} ${HEIGHT} L 0 ${HEIGHT} L ${notch} Z`;
  return `M 0 0 L ${tip} L 0 ${HEIGHT} L ${notch} Z`;
}

/**
 * Odoo-style status breadcrumb ("Draft ❯ Posted"): interlocking chevron
 * segments, each rendered at its own measured width so the point/notch
 * always meets flush. A plain CSS border can't follow a clip-path cut, so
 * the border is drawn as an absolutely positioned SVG stroke tracing the
 * same path instead.
 *
 * Markup mirrors Odoo's real `o_statusbar_status` widget: a `radiogroup` of
 * `radio` buttons (`aria-checked`/`data-value` per step) rather than plain
 * decorative spans. Jumping between steps is the consuming module's call —
 * pass `onStepChange` to allow it, omit it to keep the bar display-only.
 */
export function StatusStepper({
  steps,
  currentStepKey,
  onStepChange,
  className,
  "aria-label": ariaLabel = "Statusbar",
}: StatusStepperProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [widths, setWidths] = useState<number[]>([]);

  useLayoutEffect(() => {
    const measure = () =>
      setWidths(steps.map((_, i) => buttonRefs.current[i]?.offsetWidth ?? 0));

    measure();

    const ro = new ResizeObserver(measure);
    buttonRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [steps]);

  if (steps.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex items-stretch rtl:-scale-x-100", className)}
    >
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isActive = step.key === currentStepKey;
        const width = widths[index] ?? 0;
        const path = segmentPath(width, isFirst, isLast);

        return (
          <button
            key={step.key}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-current={isActive ? "step" : undefined}
            data-value={step.key}
            onClick={onStepChange ? () => onStepChange(step.key) : undefined}
            className={cn(
              "relative py-1.5 text-sm font-semibold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-erp-focus",
              isActive ? "text-erp-text" : "text-erp-muted hover:text-erp-text",
              isFirst ? "pl-3 pr-[22px]" : isLast ? "pl-[22px] pr-3" : "px-[22px]"
            )}
            style={{
              zIndex: isActive ? 30 : steps.length - index,
              marginLeft: isFirst ? undefined : -NOTCH,
              clipPath: path ? `path("${path}")` : undefined,
              backgroundColor: isActive ? "var(--color-erp-table-selected)" : "var(--color-erp-surface)",
            }}
          >
            {width > 0 && (
              <svg
                aria-hidden="true"
                width={width}
                height={HEIGHT}
                viewBox={`0 0 ${width} ${HEIGHT}`}
                className="pointer-events-none absolute inset-0"
                shapeRendering="geometricPrecision"
              >
                <path
                  d={path ?? `M 0 0 L ${width} 0 L ${width} ${HEIGHT} L 0 ${HEIGHT} Z`}
                  fill="none"
                  stroke={isActive ? "var(--color-erp-primary)" : "var(--color-erp-border)"}
                  strokeWidth={isActive ? 3 : 1}
                  strokeLinejoin="miter"
                />
              </svg>
            )}
            {/* Un-mirror the label since the segment shape is flipped for RTL above (rule: chevrons that convey direction flip, but text must stay readable). */}
            <span className="relative rtl:-scale-x-100">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
