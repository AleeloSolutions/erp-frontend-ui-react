import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../utils";

export interface WizardStepperProps {
  steps: string[];
  value?: number;
  onChange?: (index: number) => void;
  className?: string;
}

const NOTCH = 14;
const HEIGHT = 40;

/** Each segment's own SVG path fully describes its true visible shape — a
 * chevron point on the right (unless last) and a matching notch on the left
 * (unless first) — computed from the button's real rendered width so the
 * point/notch geometry stays exact at any label length. `undefined` for a
 * lone step (both first and last), which needs no cut at all. */
function segmentPath(
  width: number,
  isFirst: boolean,
  isLast: boolean
): string | undefined {
  if (isFirst && isLast) return undefined;
  if (width <= 0) return undefined;

  const tip = `${width - NOTCH} 0 L ${width} ${HEIGHT / 2} L ${width - NOTCH} ${HEIGHT}`;
  const notch = `${NOTCH} ${HEIGHT / 2}`;

  if (isFirst) return `M 0 0 L ${tip} L 0 ${HEIGHT} Z`;
  if (isLast) return `M 0 0 L ${width} 0 L ${width} ${HEIGHT} L 0 ${HEIGHT} L ${notch} Z`;
  return `M 0 0 L ${tip} L 0 ${HEIGHT} L ${notch} Z`;
}

/**
 * Wizard step nav: interlocking chevron segments, each rendered at its own
 * measured width so the point/notch always meets flush. A plain CSS border
 * can't follow a clip-path cut, so the border is drawn as an absolutely
 * positioned SVG stroke tracing the same path instead — same trick as
 * StatusStepper's inset-fill, applied via stroke since the point here is a
 * true diagonal rather than a flat interlock.
 */
export function WizardStepper({ steps, value, onChange, className }: WizardStepperProps) {
  const [internal, setInternal] = useState(0);
  const active = value ?? internal;

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

  const select = (i: number) => {
    if (value === undefined) setInternal(i);
    onChange?.(i);
  };

  return (
    <nav
      aria-label="Progress"
      className={cn("inline-flex items-stretch rtl:-scale-x-100", className)}
    >
      {steps.map((step, i) => {
        const isActive = i === active;
        const isFirst = i === 0;
        const isLast = i === steps.length - 1;
        const width = widths[i] ?? 0;
        const path = segmentPath(width, isFirst, isLast);

        return (
          <button
            key={step}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => select(i)}
            className={cn(
              "relative py-2.5 text-sm font-semibold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-erp-focus",
              isActive ? "text-erp-text" : "text-erp-muted hover:text-erp-text",
              isFirst ? "pl-6 pr-[38px]" : isLast ? "pl-[38px] pr-6" : "px-[38px]"
            )}
            style={{
              zIndex: isActive ? 30 : steps.length - i,
              marginLeft: isFirst ? undefined : -NOTCH,
              clipPath: path ? `path("${path}")` : undefined,
              backgroundColor: isActive
                ? "var(--color-erp-table-selected)"
                : "var(--color-erp-surface)",
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
                  stroke={
                    isActive ? "var(--color-erp-primary)" : "var(--color-erp-border)"
                  }
                  strokeWidth={isActive ? 4 : 2}
                  strokeLinejoin="miter"
                />
              </svg>
            )}
            <span className="relative rtl:-scale-x-100">{step}</span>
          </button>
        );
      })}
    </nav>
  );
}
