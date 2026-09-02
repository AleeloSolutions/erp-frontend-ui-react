import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@erp/ui";

type TrialFieldProps = {
  id: string;
  label: string;
  className?: string;
};

export const TrialFloatingInput = forwardRef<
  HTMLInputElement,
  TrialFieldProps & InputHTMLAttributes<HTMLInputElement> & { addon?: ReactNode }
>(function TrialFloatingInput({ id, label, className, addon, ...props }, ref) {
  return (
    <div
      className={cn(
        "trial-form-floating",
        addon && "trial-form-floating-addon",
        className
      )}
    >
      <input
        ref={ref}
        id={id}
        className="trial-form-control"
        placeholder={label}
        {...props}
      />
      <label htmlFor={id}>{label}</label>
      {addon ? <span className="trial-form-addon">{addon}</span> : null}
    </div>
  );
});

export function TrialFloatingSelect({
  id,
  label,
  className,
  children,
  ...props
}: TrialFieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={cn("trial-form-floating", className)}>
      <select id={id} className="trial-form-select" {...props}>
        {children}
      </select>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
