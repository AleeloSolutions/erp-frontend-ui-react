import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils";
import type { MobileNavItem } from "../../types/navigation";

export interface MobileNavProps {
  items: MobileNavItem[];
  className?: string;
  activeKey?: string;
}

export function MobileNav({ items, className, activeKey }: MobileNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 hidden h-14 border-t border-erp-border bg-white max-[720px]:flex",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          activeKey === item.key ||
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 border-0 bg-white text-[10px] text-erp-muted",
              active && "font-bold text-erp-blue"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
