import { cn } from "../../utils";
import type { FormStepperStep } from "../../types/forms";

export interface FormStepperProps {
  steps: Array<string | FormStepperStep>;
  currentStep: number;
  className?: string;
}

export function FormStepper({
  steps,
  currentStep,
  className,
}: FormStepperProps) {
  return (
    <div
      className={cn("ml-auto flex flex-wrap gap-1.5", className)}
      role="list"
      aria-label="Form steps"
    >
      {steps.map((step, index) => {
        const label = typeof step === "string" ? step : step.label;
        const key =
          typeof step === "string" ? step : (step.key ?? `${step.label}-${index}`);
        const active = index === currentStep;
        const completed = index < currentStep;

        return (
          <span
            key={key}
            role="listitem"
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex h-[22px] items-center rounded-[11px] bg-[#EEF1F4] px-2 text-[9.5px] text-erp-muted",
              (active || completed) &&
                "bg-erp-blue-100 font-bold text-erp-blue"
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
