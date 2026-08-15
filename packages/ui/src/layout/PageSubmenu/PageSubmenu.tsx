import { Link } from "react-router-dom";
import { cn } from "../../utils";
import type { SubmenuItem } from "../../types/navigation";

export interface PageSubmenuProps {
  module?: string;
  items: SubmenuItem[];
  activeKey?: string;
  className?: string;
}

export function PageSubmenu({
  module,
  items,
  activeKey,
  className,
}: PageSubmenuProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-2.5 border-t border-[#E1E8F0] bg-gradient-to-b from-white to-[#FBFCFE] px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]",
        "max-[720px]:min-h-0 max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-2.5 max-[720px]:px-2.5 max-[720px]:py-2.5",
        className
      )}
    >
      {module ? (
        <div className="relative inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border border-[#D7E4F0] bg-gradient-to-br from-[#F5FAFF] to-[#EAF3FC] px-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.62px] text-erp-blue shadow-[0_8px_18px_rgba(30,78,140,0.10),inset_0_1px_0_rgba(255,255,255,0.85)] max-[720px]:h-[34px]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[3px] rounded-full border border-white/55"
          />
          <span className="relative z-[1] h-2 w-2 rounded-full bg-gradient-to-br from-[#2F6FB3] to-erp-blue shadow-[0_0_0_4px_rgba(30,78,140,0.09),0_1px_4px_rgba(30,78,140,0.16)]" />
          <span className="relative z-[1] leading-none">{module}</span>
        </div>
      ) : null}

      <nav
        aria-label={`${module ?? "Page"} submenu`}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-[9px] bg-[rgba(248,250,252,0.92)] p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_1px_2px_rgba(16,42,67,0.03)] max-[720px]:w-full max-[720px]:rounded-xl max-[720px]:p-1"
      >
        {items.map((item) => {
          const active = activeKey ? item.key === activeKey : false;

          return (
            <Link
              key={item.key}
              to={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-[34px] shrink-0 items-center justify-center rounded-[7px] border border-transparent px-2.5 text-[10.5px] font-bold leading-none tracking-[-0.1px] text-[#64748B] whitespace-nowrap transition-all",
                "hover:-translate-y-px hover:border-[#E2EAF2] hover:bg-white hover:text-[#244E88] hover:shadow-[0_6px_14px_rgba(16,42,67,0.06)]",
                "max-[720px]:h-10 max-[720px]:px-3.5 max-[720px]:text-[11px]",
                active &&
                  "border-[#D3DFEC] bg-gradient-to-b from-white to-[#F4F8FD] font-extrabold text-erp-blue shadow-[0_3px_8px_rgba(30,78,140,0.08),inset_0_-2px_0_#1E4E8C,inset_0_1px_0_rgba(255,255,255,0.9)] before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:rounded-b-sm before:bg-gradient-to-r before:from-[#2F6FB3] before:to-[#4B8ED1] before:content-['']"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
