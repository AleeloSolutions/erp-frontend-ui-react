import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "../../utils";
import { useDisclosure } from "../../hooks";
import { useUiTranslation } from "../../i18n";
import { Checkbox } from "../../primitives/Checkbox";

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
    left: 0,
    maxHeight: 240,
    isCentered: true,
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = menuRef.current?.offsetWidth ?? 0;
    const center = rect.left + rect.width / 2;
    const pad = 8;
    let left = width > 0 ? center - width / 2 : center;
    if (width > 0) {
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    }
    setCoords({
      top: rect.bottom + 4,
      left,
      maxHeight: Math.max(120, window.innerHeight - rect.bottom - 8),
      isCentered: width === 0,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, items, updatePosition]);

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
            "z-[70] w-max min-w-[10rem] overflow-y-auto py-2",
            "rounded border border-erp-table-border bg-erp-table-bg text-[12px] text-erp-text",
            "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)] [scrollbar-width:thin]"
          )}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            maxHeight: coords.maxHeight,
            transform: coords.isCentered ? "translateX(-50%)" : undefined,
          }}
        >
          {items.map((item) => (
            <Checkbox
              key={item.id}
              hasHalo={false}
              role="menuitemcheckbox"
              aria-checked={item.isVisible}
              label={item.label}
              checked={item.isVisible}
              disabled={item.isDisabled}
              tabIndex={-1}
              onChange={() => {
                if (!item.isDisabled) item.onToggle();
              }}
              className={cn(
                "flex w-full whitespace-nowrap px-5 py-[3px] text-[12px] text-erp-text",
                "[&>span:last-child]:overflow-visible [&>span:last-child]:whitespace-nowrap",
                "hover:bg-erp-menu-hover hover:text-erp-text",
                item.isDisabled && "hover:bg-transparent"
              )}
            />
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
