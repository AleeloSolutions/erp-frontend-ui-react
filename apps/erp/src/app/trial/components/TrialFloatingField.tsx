import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@erp/ui";

type TrialFieldProps = {
  id: string;
  label: string;
  className?: string;
};

export function TrialFloatingInput({
  id,
  label,
  className,
  ...props
}: TrialFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("trial-form-floating", className)}>
      <input id={id} className="trial-form-control" placeholder={label} {...props} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

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
