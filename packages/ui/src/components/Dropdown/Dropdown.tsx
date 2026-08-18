import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  cn,
  fieldChromeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";
import { Button, type ButtonProps } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { useUiTranslation } from "../../i18n";

export interface DropdownItem {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  align?: "left" | "right";
  /**
   * Field = same chrome as Input/Select (default).
   * Button = compact Button trigger for icon/toolbar menus (DataTable row actions).
   */
  trigger?: "field" | "button";
  /** Searchable combobox — only when `trigger="field"`. */
  searchable?: boolean;
  /** Button trigger label, or static field label when not using value/onChange. */
  label?: ReactNode;
  placeholder?: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (key: string | null, item: DropdownItem | null) => void;
  onSearchMore?: () => void;
  size?: FieldSize;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  /** Field border treatment. Used when `trigger="field"`. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
  buttonProps?: Omit<ButtonProps, "children">;
  /** Hide the chevron/caret (e.g. icon-only row action triggers). */
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

function useDismiss(
  open: boolean,
  onClose: () => void,
  rootRef: RefObject<HTMLElement | null>,
  menuRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef?.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, rootRef, menuRef]);
}

function useFieldMenuCoords(anchorRef: RefObject<HTMLElement | null>) {
  const [coords, setCoords] = useState({
    top: 0 as number | undefined,
    bottom: undefined as number | undefined,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  useLayoutEffect(() => {
    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      setCoords({
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(240, Math.max(80, openUp ? spaceAbove : spaceBelow)),
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  return coords;
}

function DropdownCaret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute end-2 top-1/2 size-0 -translate-y-1/2",
        "border-x-[4px] border-x-transparent border-t-[5px] border-solid",
        open ? "border-t-erp-teal" : "border-t-erp-subtle"
      )}
    />
  );
}

function ButtonMenu({
  items,
  align,
  menuId,
  onSelect,
}: {
  items: DropdownItem[];
  align: "left" | "right";
  menuId: string;
  onSelect: (item: DropdownItem) => void;
}) {
  return (
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
          onClick={() => onSelect(item)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function FieldMenu({
  items,
  listId,
  emptyLabel,
  onSelect,
  onSearchMore,
  searchMoreLabel,
  anchorRef,
  menuRef,
}: {
  items: DropdownItem[];
  listId: string;
  emptyLabel: string;
  onSelect: (item: DropdownItem) => void;
  onSearchMore?: () => void;
  searchMoreLabel?: string;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLUListElement | null>;
}) {
  const coords = useFieldMenuCoords(anchorRef);

  return createPortal(
    <ul
      ref={menuRef}
      id={listId}
      role="listbox"
      className={cn(
        "z-[70] m-0 list-none overflow-y-auto py-2 [scrollbar-width:thin]",
        "rounded border border-erp-table-border bg-erp-table-bg text-[0.875rem] text-erp-text",
        "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)]"
      )}
      style={{
        position: "fixed",
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }}
    >
      {items.length === 0 ? (
        <li className="px-5 py-[3px] text-erp-muted">{emptyLabel}</li>
      ) : (
        items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              role="option"
              disabled={item.disabled}
              className="block w-full truncate border-0 bg-transparent px-5 py-[3px] text-start text-erp-text hover:bg-erp-menu-hover disabled:text-erp-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
            >
              {item.label}
            </button>
          </li>
        ))
      )}
      {onSearchMore ? (
        <li>
          <button
            type="button"
            className="block w-full truncate border-0 bg-transparent px-5 py-[3px] text-start text-erp-text hover:bg-erp-menu-hover"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSearchMore}
          >
            {searchMoreLabel}
          </button>
        </li>
      ) : null}
    </ul>,
    document.body
  );
}

export const Dropdown = forwardRef<HTMLInputElement, DropdownProps>(function Dropdown(
  {
    label,
    items,
    align = "left",
    trigger,
    searchable = false,
    placeholder,
    value,
    defaultValue = null,
    onChange,
    onSearchMore,
    size = "sm",
    error = false,
    disabled,
    id,
    chrome,
    chromeEdge,
    buttonProps,
    hideChevron = false,
    className,
  },
  ref
) {
  const { t } = useUiTranslation("ui");
  const [isOpen, setIsOpen] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const menuId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const isButtonTrigger = useButtonTrigger(trigger, buttonProps);
  const isFieldSelect = !isButtonTrigger && !searchable;
  const isControlledValue = value !== undefined;
  const selectedValue = isControlledValue ? value : innerValue;
  const selected = items.find((item) => item.key === selectedValue);

  const {
    className: buttonClassName,
    disabled: buttonDisabled,
    variant: _variant,
    size: _buttonSize,
    loading: _loading,
    ...restButtonProps
  } = buttonProps ?? {};

  const isDisabled = disabled ?? buttonDisabled;

  const close = () => setIsOpen(false);
  useDismiss(isOpen, close, rootRef, menuRef);

  function pickItem(item: DropdownItem) {
    if (isFieldSelect || searchable) {
      if (!isControlledValue) setInnerValue(item.key);
      onChange?.(item.key, item);
    }
    item.onClick?.();
    close();
  }

  const needle = query.trim().toLowerCase();
  const visibleItems =
    searchable && needle
      ? items.filter((item) => item.label.toLowerCase().includes(needle))
      : items;

  useEffect(() => {
    if (!searchable || isOpen) return;
    setQuery(selected?.label ?? "");
  }, [searchable, isOpen, selected?.label]);

  if (isButtonTrigger) {
    const toggle = () => setIsOpen((open) => !open);
    const menu = isOpen ? (
      <ButtonMenu items={items} align={align} menuId={menuId} onSelect={pickItem} />
    ) : null;

    return (
      <div ref={rootRef} className={cn("relative inline-flex", className)}>
        <Button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          disabled={isDisabled}
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

  if (searchable) {
    const emptyLabel = t("dropdown.noResults");
    const searchMoreLabel = t("dropdown.searchMore");

    return (
      <div ref={rootRef} className={cn("relative min-w-0 max-w-full", className)}>
        <Input
          ref={ref}
          id={id}
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          disabled={isDisabled}
          error={error}
          size={size}
          chrome={chrome}
          chromeEdge={chromeEdge}
          placeholder={placeholder}
          value={isOpen ? query : (selected?.label ?? "")}
          className="w-full truncate pe-7"
          onFocus={() => {
            if (isDisabled) return;
            setQuery(selected?.label ?? "");
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
        />
        {hideChevron ? null : <DropdownCaret open={isOpen} />}
        {isOpen ? (
          <FieldMenu
            items={visibleItems}
            listId={listId}
            emptyLabel={emptyLabel}
            onSelect={pickItem}
            onSearchMore={
              onSearchMore
                ? () => {
                    onSearchMore();
                    close();
                  }
                : undefined
            }
            searchMoreLabel={searchMoreLabel}
            anchorRef={rootRef}
            menuRef={menuRef}
          />
        ) : null}
      </div>
    );
  }

  const fieldLabel =
    selected?.label ??
    placeholder ??
    (typeof label === "string" || typeof label === "number" ? String(label) : null);

  const toggle = () => {
    if (isDisabled) return;
    setIsOpen((open) => !open);
  };

  const menu = isOpen ? (
    <FieldMenu
      items={items}
      listId={listId}
      emptyLabel={t("dropdown.noResults")}
      onSelect={pickItem}
      anchorRef={rootRef}
      menuRef={menuRef}
    />
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative min-w-0 max-w-full", className)}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={isDisabled}
        onClick={toggle}
        style={{ outline: "none", boxShadow: "none" }}
        className={cn(
          "inline-flex w-full min-w-0 items-center justify-between gap-2 text-start font-normal",
          fieldChromeClasses({ error, active: isOpen, chrome, chromeEdge }),
          fieldSizeClasses[size],
          hideChevron ? "pe-3" : "pe-7",
          !selected && placeholder ? "text-erp-placeholder" : "text-erp-text",
          buttonClassName
        )}
        {...(restButtonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className="min-w-0 flex-1 truncate">{fieldLabel}</span>
      </button>
      {hideChevron ? null : <DropdownCaret open={isOpen} />}
      {menu}
    </div>
  );
});

Dropdown.displayName = "Dropdown";
