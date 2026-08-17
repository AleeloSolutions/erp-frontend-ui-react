import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import {
  cn,
  fieldChromeClasses,
  fieldIconSizeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";
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
  /**
   * Field = same chrome as Input/Select (default).
   * Button = compact Button trigger for icon/toolbar menus (DataTable row actions).
   */
  trigger?: "field" | "button";
  size?: FieldSize;
  error?: boolean;
  /** Field border treatment. Used when `trigger="field"`. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
  buttonProps?: Omit<ButtonProps, "children">;
  /** Hide the chevron (e.g. icon-only row action triggers). */
  hideChevron?: boolean;
  className?: string;
}

function useButtonTrigger(
  trigger: DropdownProps["trigger"],
  buttonProps?: DropdownProps["buttonProps"]
) {
  if (trigger === "button") return true;
  if (trigger === "field") return false;
  return (
    buttonProps?.size === "icon" ||
    buttonProps?.variant === "ghost" ||
    buttonProps?.variant === "primary" ||
    buttonProps?.variant === "danger" ||
    buttonProps?.variant === "teal"
  );
}

export function Dropdown({
  label,
  items,
  align = "left",
  trigger,
  size = "sm",
  error = false,
  chrome,
  chromeEdge,
  buttonProps,
  hideChevron = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const isButtonTrigger = useButtonTrigger(trigger, buttonProps);

  const {
    className: buttonClassName,
    disabled,
    variant: _variant,
    size: _buttonSize,
    loading: _loading,
    ...restButtonProps
  } = buttonProps ?? {};

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

  const toggle = () => setIsOpen((value) => !value);

  const menu = isOpen ? (
    <div
      id={menuId}
      role="menu"
      className={cn(
        "absolute top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-md border border-erp-border bg-erp-surface py-1 shadow-lg",
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
  ) : null;

  if (isButtonTrigger) {
    return (
      <div ref={rootRef} className={cn("relative inline-flex", className)}>
        <Button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          disabled={disabled}
          onClick={toggle}
          className={buttonClassName}
          {...restButtonProps}
        >
          {label}
          {hideChevron ? null : (
            <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
          )}
        </Button>
        {menu}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex min-w-0 max-w-full", className)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled}
        onClick={toggle}
        style={{ outline: "none", boxShadow: "none" }}
        className={cn(
          "inline-flex w-full min-w-0 items-center justify-between gap-2 text-start font-normal",
          fieldChromeClasses({ error, active: isOpen, chrome, chromeEdge }),
          fieldSizeClasses[size],
          hideChevron ? "pe-3" : "pe-7",
          buttonClassName
        )}
        {...(restButtonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
      {hideChevron ? null : (
        <ChevronDown
          aria-hidden
          className={cn(
            "pointer-events-none absolute end-1.5 top-1/2 -translate-y-1/2 text-erp-subtle transition-transform duration-150",
            isOpen && "rotate-180",
            fieldIconSizeClasses[size]
          )}
        />
      )}
      {menu}
    </div>
  );
}
