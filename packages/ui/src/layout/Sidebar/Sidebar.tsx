import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils";
import type { NavigationItem } from "../../types/navigation";

export interface SidebarProps {
  items: NavigationItem[];
  brandName?: string;
  brandSubtitle?: string;
  brandMark?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  className?: string;
  activeKey?: string;
}

export function Sidebar({
  items,
  brandName = "Enterprise Africa",
  brandSubtitle = "Business platform",
  brandMark = "EA",
  userName = "Abdifitah Yusuf",
  userRole = "Administrator",
  userInitials = "AM",
  className,
  activeKey,
}: SidebarProps) {
  const { pathname } = useLocation();

  const isActive = (item: NavigationItem): boolean => {
    if (activeKey) return item.key === activeKey;
    if (item.href && pathname === item.href) return true;
    if (item.children?.some((child) => child.href && pathname.startsWith(child.href))) {
      return true;
    }
    return Boolean(item.href && pathname.startsWith(item.href));
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col bg-nav text-white max-[720px]:hidden min-[721px]:flex max-[980px]:w-16",
        className
      )}
    >
      <div className="flex h-[58px] items-center gap-2.5 border-b border-white/8 px-3.5 max-[980px]:justify-center max-[980px]:px-0">
        <div className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-erp-primary text-xs font-extrabold">
          {brandMark}
        </div>
        <div className="min-w-0 max-[980px]:hidden">
          <b className="block text-[13px] font-bold leading-tight">{brandName}</b>
          <span className="block text-[10px] text-white/65">{brandSubtitle}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-2" aria-label="Main navigation">
        <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.7px] text-white/50 max-[980px]:hidden">
          Main menus
        </div>
        <ul className="m-0 list-none p-0">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const content = (
              <>
                {Icon ? (
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                ) : null}
                <span className="truncate max-[980px]:hidden">{item.label}</span>
              </>
            );

            const classNameLink = cn(
              "my-0.5 flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs text-white/85 transition-colors",
              "hover:bg-nav-hover",
              active && "bg-nav-active text-white",
              "max-[980px]:justify-center max-[980px]:px-0"
            );

            return (
              <li key={item.key}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className={classNameLink}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                  >
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={classNameLink} title={item.label}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/8 p-2">
        <div className="flex items-center gap-2 rounded-md p-1.5 max-[980px]:justify-center">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-erp-blue-100 text-[11px] font-bold text-nav">
            {userInitials}
          </div>
          <div className="min-w-0 max-[980px]:hidden">
            <b className="block text-[11px] leading-tight">{userName}</b>
            <span className="block text-[9px] text-white/65">{userRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
