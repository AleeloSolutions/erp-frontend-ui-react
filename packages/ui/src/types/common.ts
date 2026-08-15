import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StatusVariant =
  | "paid"
  | "pending"
  | "approved"
  | "overdue"
  | "draft"
  | "partial"
  | "active"
  | "inactive"
  | "open"
  | "closed";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "teal"
  | "danger"
  | "ghost"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageMetaItem {
  label: string;
  value: string | number;
}

export type IconComponent = LucideIcon;

export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: ReactNode;
}
