import type { FormEventHandler, ReactNode } from "react";
import { cn } from "../../utils";
import { FormActions, type FormActionsProps } from "./FormActions";

export interface FormShellProps {
  title: string;
  description?: string;
  stepper?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  actionProps?: FormActionsProps;
  serverError?: string | null;
  children: ReactNode;
  className?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  id?: string;
}

export function FormShell({
  title,
  description,
  stepper,
  summary,
  actions,
  actionProps,
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
        "overflow-hidden rounded-lg border border-erp-border bg-erp-surface",
        className
      )}
      noValidate
    >
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-t-lg border-b border-erp-border bg-erp-surface-alt px-3">
        <div className="min-w-0 py-2">
          <h2 className="m-0 text-[15px] font-bold text-erp-text">{title}</h2>
          {description ? (
            <span className="text-[11px] text-erp-subtle">{description}</span>
          ) : null}
        </div>
        {stepper}
      </div>

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

      {actions ??
        (actionProps ? (
          <FormActions
            {...actionProps}
            className={cn("rounded-b-lg", actionProps.className)}
          />
        ) : null)}
    </form>
  );
}
