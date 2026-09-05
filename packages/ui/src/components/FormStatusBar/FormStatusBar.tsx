import { useEffect, useRef, useState } from "react";
import { Button } from "../../primitives/Button";
import type { ButtonVariant } from "../../types/common";
import { cn } from "../../utils";
import { CONTROL_PANEL_HEIGHT, NAVBAR_HEIGHT } from "../../layout/stickyOffsets";
import { StatusStepper, type StatusStep } from "./StatusStepper";

export interface FormStatusBarAction {
  key: string;
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
}

export interface FormStatusBarProps {
  actions?: FormStatusBarAction[];
  steps: StatusStep[];
  currentStepKey: string;
  onStepChange?: (key: string) => void;
  /** Set when a sticky `ControlPanel` is rendered directly above this bar, so it sticks below that instead of straight under the Navbar. */
  belowControlPanel?: boolean;
  className?: string;
}

/**
 * Odoo-style form statusbar: primary/secondary actions on the left,
 * a read-only status breadcrumb (e.g. "Draft ❯ Posted") on the right.
 * Sticks below the (also sticky) Navbar as the form sheet scrolls under it —
 * pass `belowControlPanel` when a sticky `ControlPanel` sits above it too.
 *
 * Backgroundless at rest, so it blends into the page — once scrolling
 * actually pins it in place, it picks up the page background + a bottom
 * border so scrolled content doesn't show through underneath it.
 */
export function FormStatusBar({
  actions = [],
  steps,
  currentStepKey,
  onStepChange,
  belowControlPanel = false,
  className,
}: FormStatusBarProps) {
  const visibleActions = actions.filter((action) => !action.hidden);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const stickyTop = NAVBAR_HEIGHT + (belowControlPanel ? CONTROL_PANEL_HEIGHT : 0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    // A 0-height sentinel just above the bar: once it scrolls past the
    // sticky offset, the bar itself has become pinned.
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: `-${stickyTop + 1}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stickyTop]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-0" />
      <div
        style={{ top: stickyTop }}
        className={cn(
          "sticky z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2 transition-colors",
          isStuck && "border-b border-erp-border bg-erp-bg",
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleActions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant ?? "secondary"}
              disabled={action.disabled}
              loading={action.loading}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <StatusStepper
          steps={steps}
          currentStepKey={currentStepKey}
          onStepChange={onStepChange}
        />
      </div>
    </>
  );
}
