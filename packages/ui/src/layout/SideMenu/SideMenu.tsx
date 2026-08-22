import { Link } from "react-router-dom";
import { cn } from "../../utils";
import type { SubmenuItem } from "../../types/navigation";

export interface SideMenuProps {
  /** Group heading above the links (e.g. "Statement Reports"). */
  label?: string;
  items: SubmenuItem[];
  activeKey?: string;
  className?: string;
}

/**
 * Vertical secondary navigation panel that sits beside page content — the
 * in-layout counterpart to the horizontal `PageSubmenu`.
 */
export function SideMenu({ label, items, activeKey, className }: SideMenuProps) {
  return (
    <nav
      aria-label={label ?? "Section menu"}
      className={cn(
        "w-[240px] shrink-0 border-e border-erp-border bg-white p-2 max-[720px]:hidden",
        className
      )}
    >
      {label ? (
        <div className="px-3 py-2 text-[13px] font-normal text-erp-muted">{label}</div>
      ) : null}
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const active = activeKey ? item.key === activeKey : false;

          return (
            <li key={item.key}>
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded px-3 py-2.5 text-[15px] font-normal text-erp-text transition-colors",
                  "hover:bg-black/[0.04]",
                  active && "bg-black/[0.06] font-medium"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
