import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "../../utils";
import { useDisclosure } from "../../hooks";
import { useUiTranslation } from "../../i18n";

export interface DataTableColumnsMenuItem {
  id: string;
  label: string;
  isVisible: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
}

export interface DataTableColumnsMenuProps {
  items: DataTableColumnsMenuItem[];
  defaultOpen?: boolean;
  className?: string;
}

export function DataTableColumnsMenu({
  items,
  defaultOpen = false,
  className,
}: DataTableColumnsMenuProps) {
  const { t } = useUiTranslation("ui");
  const { isOpen, close, toggle } = useDisclosure(defaultOpen);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({
    top: 0,
    right: 0,
    left: 0,
    maxHeight: 240,
    rtl: false,
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const rtl = document.documentElement.dir === "rtl";
    setCoords({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
      left: rect.left,
      maxHeight: Math.max(120, window.innerHeight - rect.bottom - 8),
      rtl,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target))
        return;
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  if (items.length === 0) return null;

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("datatable.columns")}
          className={cn(
            "z-[70] min-w-[10rem] max-w-[276px] overflow-y-auto py-2",
            "rounded border border-erp-table-border bg-erp-table-bg text-[0.875rem] text-erp-text",
            "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)] [scrollbar-width:thin]"
          )}
          style={{
            position: "fixed",
            top: coords.top,
            maxHeight: coords.maxHeight,
            ...(coords.rtl ? { left: coords.left } : { right: coords.right }),
          }}
        >
          {items.map((item) => (
            <label
              key={item.id}
              role="menuitemcheckbox"
              aria-checked={item.isVisible}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 px-5 py-[3px] text-erp-text",
                "hover:bg-erp-menu-hover hover:text-erp-text",
                item.isDisabled && "cursor-not-allowed opacity-60 hover:bg-transparent"
              )}
            >
              <input
                type="checkbox"
                className="size-3.5 shrink-0 accent-erp-teal disabled:cursor-not-allowed"
                checked={item.isVisible}
                disabled={item.isDisabled}
                tabIndex={-1}
                onChange={() => {
                  if (!item.isDisabled) item.onToggle();
                }}
              />
              <span className="min-w-0 truncate">{item.label}</span>
            </label>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={t("datatable.columns")}
        title={t("datatable.columns")}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-md border-0 bg-transparent p-0 text-erp-text",
          "hover:bg-erp-table-odd-hover",
          isOpen && "bg-erp-secondary"
        )}
        onClick={toggle}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
      </button>
      {menu}
    </div>
  );
}
