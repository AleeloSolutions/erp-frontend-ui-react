import type { ReactNode } from "react";
import { cn } from "../../utils";
import { PageSubmenu } from "../PageSubmenu";
import type { SubmenuItem } from "../../types/navigation";

export interface NavbarProps {
  /** Module brand icon (rendered element, e.g. an <img> or icon component) */
  brandIcon?: ReactNode;
  /** Module name displayed next to the brand icon */
  brandLabel?: string;
  /** Callback when the home/grid toggle is clicked */
  onHomeClick?: () => void;
  /** Submenu navigation items shown next to the brand */
  submenuItems?: SubmenuItem[];
  /** Active submenu key */
  submenuActiveKey?: string;
  /** User display name shown as a standalone button (hidden on mobile) */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Whether the user is online (shows green dot on avatar) */
  userOnline?: boolean;
  /** Full user name shown next to the avatar */
  userFullName?: string;
  /** Database/tenant name shown below the user name */
  userDatabase?: string;
  /** Callback when user menu is clicked */
  onUserClick?: () => void;
  className?: string;
}

export function Navbar({
  brandIcon,
  brandLabel,
  onHomeClick,
  submenuItems,
  submenuActiveKey,
  userName,
  userAvatar,
  userOnline = false,
  userFullName,
  onUserClick,
  className,
}: NavbarProps) {
  return (
    <header className={cn("flex h-[46px] w-full items-center bg-white px-2", className)}>
      {/* Left: Home toggle + brand + submenu */}
      <div className="flex flex-1 items-center gap-1 overflow-hidden">
        <button
          type="button"
          onClick={onHomeClick}
          className="relative flex h-[26px] shrink-0 items-center gap-2 rounded px-2 text-erp-primary hover:bg-[#e7e9ed]"
          title="Home menu"
          aria-label="Home menu"
        >
          <GridIcon />
          {brandIcon ? <span className="h-5 w-5 shrink-0">{brandIcon}</span> : null}
          {brandLabel ? (
            <span className="text-[0.875rem] font-normal text-erp-primary">
              {brandLabel}
            </span>
          ) : null}
        </button>
        {submenuItems?.length ? (
          <PageSubmenu items={submenuItems} activeKey={submenuActiveKey} />
        ) : null}
      </div>

      {/* Right: User name + avatar */}
      <div className="flex items-center gap-0.5">
        {userName ? (
          <button
            type="button"
            onClick={onUserClick}
            className="hidden h-[26px] items-center rounded px-2 text-[0.875rem] text-[#111827] truncate hover:bg-[#e7e9ed] md:flex"
            title={userName}
          >
            <span className="truncate">{userName}</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onUserClick}
          className="flex h-[26px] items-center gap-2 rounded px-1 hover:bg-[#e7e9ed]"
          aria-label="User menu"
        >
          <span className="relative inline-block h-[26px] w-[26px] shrink-0">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt=""
                className="h-full w-full rounded object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center rounded bg-[#e7e9ed] text-[11px] font-bold text-[#374151]">
                {(userFullName ?? userName ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
            {userOnline ? (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-erp-primary" />
            ) : null}
          </span>
        </button>
      </div>
    </header>
  );
}

function GridIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      className="shrink-0"
      aria-hidden
    >
      <rect width="3" height="3" x="0" y="0" />
      <rect width="3" height="3" x="5" y="0" />
      <rect width="3" height="3" x="10" y="0" />
      <rect width="3" height="3" x="0" y="5" />
      <rect width="3" height="3" x="5" y="5" />
      <rect width="3" height="3" x="10" y="5" />
      <rect width="3" height="3" x="0" y="10" />
      <rect width="3" height="3" x="5" y="10" />
      <rect width="3" height="3" x="10" y="10" />
    </svg>
  );
}
