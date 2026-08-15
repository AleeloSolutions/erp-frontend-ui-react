import type { ReactNode } from "react";
import { cn } from "../../utils";
import type { FormFieldSpan } from "../../types/forms";

const spanClasses: Record<number, string> = {
  3: "min-[721px]:col-span-3",
  4: "min-[721px]:col-span-4",
  5: "min-[721px]:col-span-5",
  6: "min-[721px]:col-span-6",
  7: "min-[721px]:col-span-7",
  8: "min-[721px]:col-span-8",
  9: "min-[721px]:col-span-9",
  10: "min-[721px]:col-span-10",
  12: "min-[721px]:col-span-12",
};

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  description?: string;
  required?: boolean;
  error?: string;
  span?: FormFieldSpan;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  description,
  required,
  error,
  span = 6,
  className,
  children,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        "col-span-12 flex flex-col gap-1",
        spanClasses[span] ?? "min-[721px]:col-span-6",
        className
      )}
    >
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[10.5px] font-semibold text-[#4B5563]"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-erp-error" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {description && !error ? (
        <p className="m-0 text-[10px] text-erp-subtle">{description}</p>
      ) : null}
      {error ? (
        <p className="m-0 text-[10px] text-erp-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
