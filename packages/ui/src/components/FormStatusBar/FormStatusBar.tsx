import { useEffect, useRef, useState } from "react";
import { Button } from "../../primitives/Button";
import type { ButtonVariant } from "../../types/common";
import { cn } from "../../utils";
import { CONTROL_PANEL_COMPACT_HEIGHT, NAVBAR_HEIGHT } from "../../layout/stickyOffsets";
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
  /**
   * When a sticky `ControlPanel` sits directly above this bar (and this bar
   * is sticky on its own), offset below that panel. Prefer wrapping both in
   * `FormStickyHeader` with `sticky={false}` instead — that removes the gap.
   */
  belowControlPanel?: boolean;
  /**
   * When false, the bar is not sticky on its own — use inside
   * `FormStickyHeader` with ControlPanel `sticky={false}`.
   */
  sticky?: boolean;
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
  sticky = true,
  className,
}: FormStatusBarProps) {
  const visibleActions = actions.filter((action) => !action.hidden);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [controlPanelHeight, setControlPanelHeight] = useState(
    CONTROL_PANEL_COMPACT_HEIGHT
  );
  const stickyTop = NAVBAR_HEIGHT + (belowControlPanel ? controlPanelHeight : 0);

  useEffect(() => {
    if (!sticky || !belowControlPanel || typeof window === "undefined") return;
    const panel = document.querySelector<HTMLElement>("[data-control-panel]");
    if (!panel) return;

    const measure = () => {
      const height = Math.round(panel.getBoundingClientRect().height);
      if (height > 0) setControlPanelHeight(height);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [belowControlPanel, sticky]);

  useEffect(() => {
    if (!sticky) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: `-${stickyTop + 1}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sticky, stickyTop]);

  // Shared FormStickyHeader: observe the wrapper so the bar still gets a
  // bottom border once the stack is pinned.
  useEffect(() => {
    if (sticky) return;
    const header = document.querySelector<HTMLElement>("[data-form-sticky-header]");
    if (!header || typeof IntersectionObserver === "undefined") return;
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "height:0;width:0;overflow:hidden;";
    header.parentElement?.insertBefore(sentinel, header);
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: `-${NAVBAR_HEIGHT + 1}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [sticky]);

  return (
    <>
      {sticky ? <div ref={sentinelRef} aria-hidden className="h-0" /> : null}
      <div
        style={sticky ? { top: stickyTop } : undefined}
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 px-4 transition-colors",
          sticky && "sticky z-20",
          "py-2",
          !sticky && "-mt-px",
          sticky && belowControlPanel && "-mt-px",
          isStuck && "border-b border-erp-border bg-erp-bg shadow-sm",
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
