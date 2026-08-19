import { Link } from "react-router-dom";
import { cn } from "../../utils";
import type { SubmenuItem } from "../../types/navigation";

export interface PageSubmenuProps {
  module?: string;
  items: SubmenuItem[];
  activeKey?: string;
  className?: string;
}

export function PageSubmenu({ items, activeKey, className }: PageSubmenuProps) {
  return (
    <nav
      aria-label="Page submenu"
      className={cn(
        "flex items-center gap-1 overflow-x-auto",
        "max-[720px]:w-full max-[720px]:py-1",
        className
      )}
    >
      {items.map((item) => {
        const active = activeKey ? item.key === activeKey : false;

        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded px-2.5 text-[13px] font-normal text-erp-muted whitespace-nowrap transition-colors",
              "hover:bg-black/[0.06] hover:text-erp-text",
              "max-[720px]:h-9 max-[720px]:px-3 max-[720px]:text-sm",
              active && "bg-black/[0.06] font-medium text-erp-text"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
