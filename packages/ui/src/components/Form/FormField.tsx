import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
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

type PlaceholderChildProps = {
  placeholder?: string;
};

function withLabelPlaceholder(child: ReactNode, label?: string): ReactNode {
  if (!label || !isValidElement(child)) {
    return child;
  }

  const element = child as ReactElement<PlaceholderChildProps>;
  if (element.props.placeholder != null) {
    return child;
  }

  return cloneElement(element, { placeholder: label });
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
        "col-span-12",
        spanClasses[span] ?? "min-[721px]:col-span-6",
        className
      )}
    >
      <div
        className={cn(
          "grid items-center gap-x-2.5 gap-y-1",
          label ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1"
        )}
      >
        {label ? (
          <label
            htmlFor={htmlFor}
            className="shrink-0 text-[10.5px] font-semibold whitespace-nowrap text-erp-text"
          >
            {label}
            {required ? (
              <span className="ms-0.5 text-erp-error" aria-hidden>
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <div className="min-w-0">
          {Children.map(children, (child) => withLabelPlaceholder(child, label))}
        </div>
        {description && !error ? (
          <p className={cn("m-0 text-[10px] text-erp-subtle", label && "col-start-2")}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p
            className={cn("m-0 text-[10px] text-erp-error", label && "col-start-2")}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
