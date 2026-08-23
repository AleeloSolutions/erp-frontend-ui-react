import { Button } from "../../primitives/Button";
import type { ButtonVariant } from "../../types/common";
import { cn } from "../../utils";
import { StatusStepper, type StatusStep } from "./StatusStepper";

export interface FormStatusBarAction {
  key: string;
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  hidden?: boolean;
}

export interface FormStatusBarProps {
  actions?: FormStatusBarAction[];
  steps: StatusStep[];
  currentStepKey: string;
  className?: string;
}

/**
 * Odoo-style form statusbar: primary/secondary actions on the left,
 * a read-only status breadcrumb (e.g. "Draft ❯ Posted") on the right.
 * Sticks to the top of the scrollable form sheet.
 */
export function FormStatusBar({
  actions = [],
  steps,
  currentStepKey,
  className,
}: FormStatusBarProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-erp-border bg-erp-surface px-4 py-2 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleActions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant ?? "secondary"}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <StatusStepper steps={steps} currentStepKey={currentStepKey} />
    </div>
  );
}
