import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  cn,
  fieldChromeClasses,
  fieldIconSizeClasses,
  fieldSizeClasses,
  type FieldSize,
} from "../../utils";

export interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: boolean;
  /** Inclusive minimum date as `YYYY-MM-DD`. */
  min?: string;
  /** Inclusive maximum date as `YYYY-MM-DD`. */
  max?: string;
  disabledDates?: (date: Date) => boolean;
  clearable?: boolean;
  placeholder?: string;
  /** BCP 47 locale for display (default: runtime locale). */
  locale?: string;
  /**
   * Intl date style for the visible field. Default `medium`.
   * Does not change the emitted `YYYY-MM-DD` value.
   */
  displayStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  /** Visual size. Defaults to `sm`. */
  size?: FieldSize;
  className?: string;
}

function parseISODate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfterDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function emitChange(
  onChange: DatePickerProps["onChange"],
  name: string | undefined,
  next: string,
  input: HTMLInputElement | null
) {
  if (!onChange) return;
  const target = input ?? ({ name: name ?? "", value: next } as HTMLInputElement);
  if (input) {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    );
    descriptor?.set?.call(input, next);
  }
  onChange({
    target: { ...target, name: name ?? "", value: next },
    currentTarget: { ...target, name: name ?? "", value: next },
  } as ChangeEvent<HTMLInputElement>);
}

function buildMonthGrid(monthCursor: Date): (Date | null)[] {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled = false,
      error = false,
      min,
      max,
      disabledDates,
      clearable = false,
      placeholder = "Select date",
      locale,
      displayStyle = "medium",
      size = "sm",
      className,
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
    const isoValue = isControlled ? (value ?? "") : uncontrolled;
    const selected = parseISODate(isoValue);

    const [open, setOpen] = useState(false);
    const [monthCursor, setMonthCursor] = useState(
      () => selected ?? startOfDay(new Date())
    );
    const rootRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement | null>(null);
    const syncedFromDomRef = useRef(false);
    const popupId = useId();

    const minDate = parseISODate(min);
    const maxDate = parseISODate(max);

    const formatter = useMemo(
      () =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: displayStyle,
        }),
      [locale, displayStyle]
    );

    const monthFormatter = useMemo(
      () =>
        new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
        }),
      [locale]
    );

    const weekdayLabels = useMemo(() => {
      const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2021, 7, index + 1);
        return fmt.format(date);
      });
    }, [locale]);

    useEffect(() => {
      if (selected) setMonthCursor(selected);
    }, [isoValue]); // eslint-disable-line react-hooks/exhaustive-deps -- sync month when value string changes

    useEffect(() => {
      if (!open) return;

      const onPointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };

      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [open]);

    function assignRefs(node: HTMLInputElement | null) {
      hiddenRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
      if (node && value === undefined && !syncedFromDomRef.current && node.value) {
        syncedFromDomRef.current = true;
        setUncontrolled(node.value);
      }
    }

    function isDisabledDay(date: Date): boolean {
      if (minDate && isBeforeDay(date, minDate)) return true;
      if (maxDate && isAfterDay(date, maxDate)) return true;
      if (disabledDates?.(date)) return true;
      return false;
    }

    function commit(next: string) {
      if (!isControlled) setUncontrolled(next);
      emitChange(onChange, name, next, hiddenRef.current);
    }

    function selectDay(date: Date) {
      if (disabled || isDisabledDay(date)) return;
      commit(toISODate(date));
      setOpen(false);
    }

    function clear() {
      if (disabled) return;
      commit("");
      setOpen(false);
    }

    const cells = buildMonthGrid(monthCursor);
    const display = selected ? formatter.format(selected) : "";

    function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
    }

    return (
      <div ref={rootRef} className={cn("relative w-full min-w-0 max-w-full", className)}>
        <input
          ref={assignRefs}
          id={id}
          name={name}
          type="text"
          value={isoValue}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]"
          onChange={() => undefined}
          onBlur={onBlur}
        />

        <div
          className={cn(
            "flex w-full items-center gap-1",
            fieldChromeClasses({
              error,
              within: true,
              active: open,
              disabled,
            }),
            fieldSizeClasses[size]
          )}
        >
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={popupId}
            onClick={() => setOpen((prev) => !prev)}
            onKeyDown={onTriggerKeyDown}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 text-start text-inherit outline-none focus:outline-none focus-visible:outline-none",
              !display && "text-erp-placeholder"
            )}
          >
            <CalendarIcon
              className={cn("shrink-0 text-erp-subtle", fieldIconSizeClasses[size])}
              aria-hidden
            />
            <span className="truncate">{display || placeholder}</span>
          </button>
          {clearable && isoValue ? (
            <button
              type="button"
              disabled={disabled}
              aria-label="Clear date"
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-erp-muted hover:bg-erp-surface-muted hover:text-erp-text"
              onClick={clear}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "shrink-0 text-erp-subtle transition-transform duration-150",
              fieldIconSizeClasses[size],
              open && "rotate-180"
            )}
          />
        </div>

        {open && !disabled ? (
          <div
            id={popupId}
            role="dialog"
            aria-modal="false"
            aria-label="Choose date"
            className="absolute start-0 z-50 mt-1 w-[280px] rounded-lg border border-erp-border bg-white p-2.5 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous month"
                className="grid h-7 w-7 place-items-center rounded-md text-erp-muted hover:bg-erp-surface-muted"
                onClick={() =>
                  setMonthCursor(
                    new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="text-[12px] font-bold text-erp-text">
                {monthFormatter.format(monthCursor)}
              </div>
              <button
                type="button"
                aria-label="Next month"
                className="grid h-7 w-7 place-items-center rounded-md text-erp-muted hover:bg-erp-surface-muted"
                onClick={() =>
                  setMonthCursor(
                    new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="grid h-7 place-items-center text-[9px] font-extrabold uppercase tracking-[0.04em] text-erp-label"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5" role="grid">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-8" />;
                }
                const iso = toISODate(date);
                const isSelected = selected ? sameDay(date, selected) : false;
                const isToday = sameDay(date, new Date());
                const dayDisabled = isDisabledDay(date);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    disabled={dayDisabled}
                    className={cn(
                      "grid h-8 place-items-center rounded-md text-[11px] font-semibold text-erp-text hover:bg-erp-primary-50",
                      isToday && !isSelected && "ring-1 ring-erp-border-strong",
                      isSelected &&
                        "bg-erp-primary text-erp-primary-foreground hover:bg-erp-primary",
                      dayDisabled &&
                        "cursor-not-allowed text-erp-placeholder opacity-50 hover:bg-transparent"
                    )}
                    onClick={() => selectDay(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-erp-border-soft pt-2">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[10.5px] font-bold text-erp-primary hover:bg-erp-primary-50"
                onClick={() => {
                  const today = startOfDay(new Date());
                  if (!isDisabledDay(today)) selectDay(today);
                }}
              >
                Today
              </button>
              {clearable ? (
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-[10.5px] font-bold text-erp-muted hover:bg-erp-surface-muted"
                  onClick={clear}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
