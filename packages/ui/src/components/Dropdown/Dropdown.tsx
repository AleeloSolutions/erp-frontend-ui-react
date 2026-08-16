import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../../primitives/Button";

export interface DropdownItem {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  label: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  buttonProps?: Omit<ButtonProps, "children">;
  /** Hide the chevron (e.g. icon-only row action triggers). */
  hideChevron?: boolean;
  className?: string;
}

export function Dropdown({
  label,
  items,
  align = "left",
  buttonProps,
  hideChevron = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <Button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((value) => !value)}
        {...buttonProps}
      >
        {label}
        {hideChevron ? null : <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />}
      </Button>
      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-md border border-erp-border bg-white py-1 shadow-lg",
            align === "right" ? "end-0" : "start-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center px-2.5 py-1.5 text-left text-[11px] font-semibold text-erp-text hover:bg-erp-blue-50",
                item.danger && "text-erp-error hover:bg-erp-error-bg",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
