import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../utils";
import type { SubmenuItem } from "../../types/navigation";

export interface PageSubmenuProps {
  module?: string;
  items: SubmenuItem[];
  activeKey?: string;
  className?: string;
}

export function PageSubmenu({ items, activeKey, className }: PageSubmenuProps) {
  return (
    <nav
      aria-label="Page submenu"
      className={cn(
        "flex items-center gap-1 overflow-x-auto",
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
            />
          );
        }

        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded px-2.5 text-[13px] font-normal text-erp-muted whitespace-nowrap transition-colors",
              "hover:bg-black/[0.06] hover:text-erp-text",
              "max-[720px]:h-9 max-[720px]:px-3 max-[720px]:text-sm",
              active && "bg-black/[0.06] font-medium text-erp-text"
            )}
          >
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
}: {
  item: SubmenuItem;
  active: boolean;
  activeKey?: string;
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
          "inline-flex h-8 shrink-0 items-center rounded px-2.5 text-[13px] font-normal text-erp-muted whitespace-nowrap transition-colors",
          "border border-transparent",
          "hover:bg-black/[0.06] hover:text-erp-text",
          "max-[720px]:h-9 max-[720px]:px-3 max-[720px]:text-sm",
          (active || hasActiveChild) && !open && "bg-black/[0.06] font-medium text-black",
          open &&
            "border-erp-teal bg-erp-teal-50 font-medium text-erp-text hover:bg-erp-teal-50 hover:text-erp-text"
        )}
      >
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
