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
