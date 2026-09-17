import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: NavigationItem[];
}

export interface SubmenuItem {
  key: string;
  label: string;
  href: string;
  /**
   * Leading mark for the item. A module's logo belongs here: pass a
   * LucideIcon while a module has no artwork, or a rendered node (an
   * <img>) once it has, so swapping one for the other is a prop change
   * rather than a layout change.
   */
  icon?: LucideIcon | ReactNode;
  /**
   * When set, PageSubmenu prevents default navigation and calls this
   * instead — used for in-page / state-only module switches (e.g. Settings).
   */
  onClick?: () => void;
  children?: SubmenuItem[];
}

export interface MobileNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}
