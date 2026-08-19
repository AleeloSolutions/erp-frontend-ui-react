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
  children?: SubmenuItem[];
}

export interface MobileNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}
