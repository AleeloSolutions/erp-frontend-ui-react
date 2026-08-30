import { cn } from "../../utils";

export type TabItem = {
  key: string;
  label: string;
  disabled?: boolean;
};

/** How the tab bar aligns relative to its parent container. */
export type TabsAlign = "bleed" | "container";

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  className?: string;
  /**
   * `bleed` — Odoo notebook style: negative horizontal margin with matching
   * padding so tabs span padded form shells. Default for invoice/form pages.
   * `container` — tab bar stays within the parent width (e.g. Settings page).
   */
  align?: TabsAlign;
  /** Accessible name for the tab list */
  "aria-label"?: string;
}

const tabListBaseClass =
  "m-0 flex list-none flex-row flex-wrap border-b border-erp-secondary-border bg-erp-table-bg p-0 [scrollbar-width:thin]";

const tabListAlignClass: Record<TabsAlign, string> = {
  bleed: "-mx-12 px-12",
  container: "",
};

const tabButtonBase =
  "mb-[-1px] block border border-transparent px-4 py-2 text-sm leading-normal whitespace-nowrap text-erp-form-label transition-[border-color,color,background-color] duration-150";

/**
 * Odoo notebook-style nav tabs (Bootstrap `nav-tabs` + Notebook overrides).
 */
export function Tabs({
  items,
  activeKey,
  onChange,
  className,
  align = "bleed",
  "aria-label": ariaLabel = "Tabs",
}: TabsProps) {
  return (
    <nav aria-label={ariaLabel} className={cn("min-w-0", className)}>
      <ul className={cn(tabListBaseClass, tabListAlignClass[align])} role="tablist">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key} className="shrink-0" role="presentation">
              <button
                type="button"
                role="tab"
                name={item.key}
                aria-selected={active}
                tabIndex={active ? -1 : 0}
                disabled={item.disabled}
                className={cn(
                  tabButtonBase,
                  !active &&
                    !item.disabled &&
                    "cursor-pointer hover:border-erp-secondary hover:bg-erp-secondary hover:border-b-erp-secondary-border hover:isolate",
                  active &&
                    "relative z-[1] mb-[-1px] cursor-default border-erp-secondary-border border-b-0 bg-erp-table-bg text-erp-primary-hover before:absolute before:inset-x-[-1px] before:top-[-1px] before:h-[3px] before:bg-erp-primary-hover before:content-[''] hover:border-erp-secondary-border hover:border-b-0 hover:text-erp-primary",
                  item.disabled && "cursor-not-allowed opacity-55"
                )}
                onClick={() => {
                  if (!item.disabled && !active) onChange?.(item.key);
                }}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
