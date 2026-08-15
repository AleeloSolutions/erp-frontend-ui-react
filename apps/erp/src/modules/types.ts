import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { NavigationItem, SubmenuItem } from "@erp/ui";

export interface ErpModule {
  id: string;
  label: string;
  version: string;
  description?: string;
  icon: LucideIcon;
  path: string;
  required?: boolean;
  dependsOn?: string[];
  nav: NavigationItem;
  submenu?: SubmenuItem[];
  Routes: ComponentType;
}
