import type { ReactNode } from "react";
import type { PageMetaItem, SelectOption } from "../../types/common";
import type { SubmenuItem } from "../../types/navigation";
import { Select } from "../../primitives/Select";
import { PageSubmenu } from "../PageSubmenu";
import { cn } from "../../utils";

export interface PageHeaderProps {
  module?: string;
  section?: string;
  title: string;
  description?: string;
  /** Pass a rendered icon element, e.g. `<FileText className="h-4 w-4" />` */
  icon?: ReactNode;
  actions?: ReactNode;
  tools?: ReactNode;
  organizations?: SelectOption[];
  branches?: SelectOption[];
  organizationValue?: string;
  branchValue?: string;
  onOrganizationChange?: (value: string) => void;
  onBranchChange?: (value: string) => void;
  meta?: PageMetaItem[];
  submenu?: {
    module?: string;
    items: SubmenuItem[];
    activeKey?: string;
  };
  className?: string;
}

export function PageHeader({
  module,
  section,
  title,
  description,
  icon,
  actions,
  tools,
  organizations,
  branches,
  organizationValue,
  branchValue,
  onOrganizationChange,
  onBranchChange,
  meta,
  submenu,
  className,
}: PageHeaderProps) {
  const showContextSelects = Boolean(organizations?.length || branches?.length);

  return (
    <section
      className={cn(
        "mb-2 overflow-hidden rounded-[10px] border border-[#D9E2EC]",
        "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F9FBFD_100%)]",
        "shadow-[0_4px_14px_rgba(16,42,67,0.05),0_1px_3px_rgba(16,42,67,0.03)]",
        className
      )}
    >
      <div className="grid min-h-[68px] grid-cols-1 items-center gap-3 px-3 py-2.5 min-[721px]:grid-cols-[minmax(0,1fr)_minmax(320px,auto)]">
        <div className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)] items-center gap-2.5">
          {icon ? (
            <div className="relative grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-gradient-to-br from-[#2F6FB3] to-erp-blue text-white shadow-[0_5px_12px_rgba(30,78,140,0.16)]">
              {icon}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1 rounded-[7px] border border-white/16"
              />
            </div>
          ) : null}

          <div className="min-w-0">
            {(module || section) && (
              <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.65px] text-[#7A869A]">
                {module ? <span>{module}</span> : null}
                {module && section ? (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#A7B1BE]" />
                ) : null}
                {section ? <span>{section}</span> : null}
              </div>
            )}
            <h1 className="m-0 text-xl font-bold tracking-[-0.35px] text-erp-text leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="m-0 max-w-[760px] text-[11px] leading-[1.35] text-[#667085]">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 min-[721px]:justify-end">
          {showContextSelects ? (
            <div className="flex flex-wrap items-center gap-1.5 max-[720px]:grid max-[720px]:w-full max-[720px]:grid-cols-2">
              {organizations?.length ? (
                <Select
                  aria-label="Organization"
                  className="h-7 min-w-[150px] text-[10.5px] max-[720px]:min-w-0 max-[720px]:w-full"
                  options={organizations}
                  value={organizationValue}
                  onChange={(event) => onOrganizationChange?.(event.target.value)}
                />
              ) : null}
              {branches?.length ? (
                <Select
                  aria-label="Branch"
                  className="h-7 min-w-[118px] text-[10.5px] max-[720px]:min-w-0 max-[720px]:w-full"
                  options={branches}
                  value={branchValue}
                  onChange={(event) => onBranchChange?.(event.target.value)}
                />
              ) : null}
            </div>
          ) : null}

          {tools ? <div className="ml-auto flex items-center gap-1.5">{tools}</div> : null}

          {actions ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5 max-[720px]:w-full [&_button]:max-[720px]:flex-1">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      {meta?.length ? (
        <div className="grid max-w-[540px] grid-cols-1 gap-2 px-3 pb-3 min-[721px]:grid-cols-3">
          {meta.map((item) => (
            <div
              key={item.label}
              className="flex min-h-[60px] flex-col justify-center gap-1 rounded-xl border border-[#E3EAF2] bg-gradient-to-b from-white to-[#F8FBFE] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              <strong className="text-lg font-extrabold tracking-[-0.25px] text-erp-text leading-none">
                {item.value}
              </strong>
              <span className="text-[10px] font-bold uppercase tracking-[0.45px] text-[#7A869A]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {submenu ? (
        <PageSubmenu
          module={submenu.module ?? module}
          items={submenu.items}
          activeKey={submenu.activeKey}
        />
      ) : null}
    </section>
  );
}
