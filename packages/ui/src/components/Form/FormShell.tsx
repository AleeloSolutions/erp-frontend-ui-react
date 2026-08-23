import type { FormEventHandler, ReactNode } from "react";
import { cn } from "../../utils";

export interface FormShellProps {
  summary?: ReactNode;
  serverError?: string | null;
  children: ReactNode;
  className?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  id?: string;
}

export function FormShell({
  summary,
  serverError,
  children,
  className,
  onSubmit,
  id,
}: FormShellProps) {
  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={cn(
        "overflow-hidden rounded-sm border border-erp-border bg-white mx-4 shadow-sm px-6 py-6",
        className
      )}
      noValidate
    >
      {serverError ? (
        <div
          className="border-b border-erp-error/20 bg-erp-error-bg px-3 py-2 text-[11px] text-erp-error"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1",
          summary && "min-[981px]:grid-cols-[minmax(0,1fr)_280px]"
        )}
      >
        <div className="min-w-0">{children}</div>
        {summary}
      </div>
    </form>
  );
}
