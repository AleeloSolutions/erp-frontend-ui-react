import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../utils";
import type { LucideIcon } from "lucide-react";
import type { SubmenuItem } from "../../types/navigation";

/**
 * How loudly the submenu states itself.
 *
 * `default` is the module navbar: a filled pill marks the open page.
 * `quiet` is for a secondary surface sitting under a module — Settings —
 * where the same pill competes with the page it is framing. It trades the
 * pill for a hairline under the open item and steps the type down, so the
 * bar reads as a place you are passing through rather than the subject.
 */
export type SubmenuTone = "default" | "quiet";

const TONES: Record<
  SubmenuTone,
  { item: string; icon: string; idle: string; active: string }
> = {
  default: {
    item: "h-8 gap-1.5 px-2.5 text-[13px] max-[720px]:h-9 max-[720px]:px-3 max-[720px]:text-sm",
    icon: "h-4 w-4",
    idle: "text-erp-muted hover:bg-black/[0.06] hover:text-erp-text",
    active: "bg-black/[0.06] font-medium text-erp-text",
  },
  quiet: {
    item: "h-7 gap-1.5 px-2 text-[12px] max-[720px]:h-8 max-[720px]:px-2.5 max-[720px]:text-[13px]",
    icon: "h-3.5 w-3.5",
    idle: "text-erp-subtle hover:bg-black/[0.04] hover:text-erp-text",
    active:
      "font-medium text-erp-text after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-erp-primary",
  },
};

export interface PageSubmenuProps {
  module?: string;
  items: SubmenuItem[];
  activeKey?: string;
  /** Visual weight — see SubmenuTone. Defaults to the module navbar. */
  tone?: SubmenuTone;
  className?: string;
}

/**
 * Render an item's leading mark.
 *
 * `icon` is either a LucideIcon (a component, which we size ourselves) or
 * something already rendered — an <img> logo, say — which we only box.
 */
function SubmenuIcon({
  icon,
  className,
}: {
  icon: SubmenuItem["icon"];
  className: string;
}) {
  if (!icon) return null;

  // Already rendered -- a logo <img>, say. Box it and leave it alone.
  if (isValidElement(icon)) {
    return (
      <span
        className={cn(
          className,
          "grid shrink-0 place-items-center [&>*]:h-full [&>*]:w-full"
        )}
        aria-hidden
      >
        {icon as ReactNode}
      </span>
    );
  }

  // Otherwise a component type. Not necessarily a *function*: lucide-react
  // ships forwardRef objects, so testing `typeof icon === "function"` here
  // silently rendered nothing at all.
  const Icon = icon as LucideIcon;
  return <Icon className={cn(className, "shrink-0")} aria-hidden />;
}

export function PageSubmenu({
  items,
  activeKey,
  tone = "default",
  className,
}: PageSubmenuProps) {
  const styles = TONES[tone];

  return (
    <nav
      aria-label="Page submenu"
      className={cn(
        // overflow-y-hidden is not redundant: `overflow-x: auto` alone
        // computes overflow-y to auto, and any item that paints to its own
        // edge then raises a vertical scrollbar over the whole bar.
        "flex items-center gap-1 overflow-x-auto overflow-y-hidden",
        // The bar still scrolls -- by wheel, swipe, or tabbing an item into
        // view -- but a scrollbar track eats a third of a 46px navbar, and
        // it only ever showed up once the module list grew.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "max-[720px]:w-full max-[720px]:py-1",
        className
      )}
    >
      {items.map((item) => {
        const active = activeKey ? item.key === activeKey : false;

        if (item.children?.length) {
          return (
            <SubmenuDropdown
              key={item.key}
              item={item}
              active={active}
              activeKey={activeKey}
              styles={styles}
            />
          );
        }

        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? "page" : undefined}
            onClick={
              item.onClick
                ? (event) => {
                    event.preventDefault();
                    item.onClick?.();
                  }
                : undefined
            }
            className={cn(
              "relative inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap transition-colors",
              styles.item,
              active ? styles.active : styles.idle
            )}
          >
            <SubmenuIcon icon={item.icon} className={styles.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SubmenuDropdown({
  item,
  active,
  activeKey,
  styles,
}: {
  item: SubmenuItem;
  active: boolean;
  activeKey?: string;
  styles: (typeof TONES)[SubmenuTone];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const rect = triggerRef.current?.getBoundingClientRect();

  const hasActiveChild = item.children?.some((c) => c.key === activeKey);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "relative inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap transition-colors",
          "border border-transparent",
          styles.item,
          styles.idle,
          (active || hasActiveChild) && !open && styles.active,
          open &&
            "border-erp-teal bg-erp-teal-50 font-medium text-erp-text after:hidden hover:bg-erp-teal-50 hover:text-erp-text"
        )}
      >
        <SubmenuIcon icon={item.icon} className={styles.icon} />
        {item.label}
      </button>

      {open && rect
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[1070] min-w-[10rem] overflow-y-auto rounded border border-[#d8dadd] bg-white py-1.5 text-[0.875rem] text-[#111827] shadow-[0_0.3rem_1rem_rgba(0,0,0,0.1)]"
              style={{
                top: rect.bottom + 4,
                left: rect.left,
                maxHeight: `calc(100vh - ${rect.bottom + 8}px)`,
                scrollbarWidth: "thin",
              }}
            >
              {item.children!.map((child) => {
                const childActive = activeKey ? child.key === activeKey : false;
                return (
                  <a
                    key={child.key}
                    role="menuitem"
                    href={child.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      navigate(child.href);
                    }}
                    className={cn(
                      "block px-5 py-[3px] text-[0.875rem] text-[#111827] no-underline transition-colors",
                      "hover:bg-black/[0.08]",
                      childActive && "font-medium bg-black/[0.04]"
                    )}
                  >
                    {child.label}
                  </a>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
