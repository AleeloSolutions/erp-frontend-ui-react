import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useUiTranslation } from "../../i18n";
import {
  cn,
  fieldChromeClasses,
  fieldIconSizeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
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
  /** Field border treatment. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
  className?: string;
}

type CalendarView = "days" | "months";

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

function isoWeek(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Six Sunday-start weeks, including adjacent-month days. */
function buildMonthDays(monthCursor: Date): Date[] {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
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

type PopoverPlacement = "bottom" | "top" | "left";

type PopoverCoords = {
  top: number;
  left: number;
  placement: PopoverPlacement;
  arrowOffset: number;
};

function usePopoverCoords(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  view: CalendarView
): PopoverCoords {
  const [coords, setCoords] = useState<PopoverCoords>({
    top: 0,
    left: 0,
    placement: "bottom",
    arrowOffset: 16,
  });

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const width = popover?.offsetWidth ?? 272;
      const height = popover?.offsetHeight ?? 300;
      const pad = 8;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const spaceAbove = rect.top - pad;
      const spaceLeft = rect.left - pad;
      const openLeft =
        spaceBelow < height + gap && spaceAbove < height + gap && spaceLeft > width + gap;

      if (openLeft) {
        const top = Math.max(
          pad,
          Math.min(
            rect.top + rect.height / 2 - height / 2,
            window.innerHeight - height - pad
          )
        );
        setCoords({
          top,
          left: rect.left - width - gap,
          placement: "left",
          arrowOffset: rect.top + rect.height / 2 - top,
        });
        return;
      }

      const openUp = spaceBelow < height + gap && spaceAbove > spaceBelow;
      const top = openUp ? rect.top - height - gap : rect.bottom + gap;
      setCoords({
        top,
        left: Math.max(pad, Math.min(rect.left, window.innerWidth - width - pad)),
        placement: openUp ? "top" : "bottom",
        arrowOffset:
          rect.left +
          rect.width / 2 -
          Math.max(pad, Math.min(rect.left, window.innerWidth - width - pad)),
      });
    }

    update();
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, popoverRef, view]);

  return coords;
}

function PopoverArrow({
  placement,
  offset,
  size = 16,
}: {
  placement: PopoverPlacement;
  offset: number;
  size?: number;
}) {
  const hang = size / 2;
  const base =
    "pointer-events-none absolute z-[-1] rotate-45 bg-erp-datepicker-popover-bg";

  if (placement === "left") {
    return (
      <span
        aria-hidden
        className={cn(base)}
        style={{
          width: size,
          height: size,
          right: -hang,
          top: Math.max(12, Math.min(offset, 280)),
        }}
      />
    );
  }

  if (placement === "top") {
    return (
      <span
        aria-hidden
        className={cn(base)}
        style={{
          width: size,
          height: size,
          bottom: -hang,
          left: Math.max(12, offset - hang),
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(base)}
      style={{
        width: size,
        height: size,
        top: -hang,
        left: Math.max(12, offset - hang),
      }}
    />
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-sm border border-transparent bg-transparent",
        "text-erp-text opacity-75 hover:border-erp-teal hover:bg-erp-menu-hover hover:opacity-100"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DayCell({
  date,
  monthCursor,
  selected,
  isDisabledDay,
  onSelect,
}: {
  date: Date;
  monthCursor: Date;
  selected: Date | null;
  isDisabledDay: (date: Date) => boolean;
  onSelect: (date: Date) => void;
}) {
  const isSelected = selected ? sameDay(date, selected) : false;
  const isToday = sameDay(date, new Date());
  const isOutside = date.getMonth() !== monthCursor.getMonth();
  const dayDisabled = isDisabledDay(date);

  return (
    <button
      type="button"
      role="gridcell"
      aria-selected={isSelected}
      disabled={dayDisabled}
      className={cn(
        "flex h-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0",
        dayDisabled && "cursor-not-allowed opacity-50"
      )}
      onClick={() => onSelect(date)}
    >
      <div className="relative flex size-8 items-center justify-center">
        {isSelected ? (
          <span aria-hidden className="absolute inset-0 rounded-full bg-erp-primary-50" />
        ) : null}
        <div
          className={cn(
            "relative z-[1] flex w-3/4 min-h-[1.35rem] items-center justify-center rounded-full text-center text-[0.675rem] leading-none",
            isOutside && "text-erp-datepicker-day-outside",
            !isOutside && !isSelected && "text-erp-text",
            isSelected && "bg-erp-primary font-semibold text-erp-primary-foreground",
            isToday && !isSelected && "font-bold text-erp-text",
            !isSelected && !dayDisabled && "hover:bg-erp-menu-hover"
          )}
        >
          {date.getDate()}
        </div>
      </div>
    </button>
  );
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
      chrome,
      chromeEdge,
      className,
    },
    ref
  ) {
    const { t } = useUiTranslation("ui");
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
    const isoValue = isControlled ? (value ?? "") : uncontrolled;
    const selected = parseISODate(isoValue);

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<CalendarView>("days");
    const [monthCursor, setMonthCursor] = useState(
      () => selected ?? startOfDay(new Date())
    );
    const rootRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement | null>(null);
    const syncedFromDomRef = useRef(false);
    const popupId = useId();
    const coords = usePopoverCoords(open, rootRef, popoverRef, view);

    const minDate = parseISODate(min);
    const maxDate = parseISODate(max);

    const formatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { dateStyle: displayStyle }),
      [locale, displayStyle]
    );
    const monthYearFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }),
      [locale]
    );
    const monthFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { month: "short" }),
      [locale]
    );
    const weekdayLabels = useMemo(() => {
      const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
      return Array.from({ length: 7 }, (_, index) =>
        fmt.format(new Date(2021, 7, index + 1))
      );
    }, [locale]);

    useEffect(() => {
      if (selected) setMonthCursor(selected);
    }, [isoValue]); // eslint-disable-line react-hooks/exhaustive-deps -- sync month when value string changes

    useEffect(() => {
      if (open) return;
      setView("days");
    }, [open]);

    useEffect(() => {
      if (!open) return;

      const onPointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
          return;
        }
        setOpen(false);
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

    function shiftCursor(delta: number) {
      if (view === "months") {
        setMonthCursor(
          new Date(monthCursor.getFullYear() + delta, monthCursor.getMonth(), 1)
        );
        return;
      }
      setMonthCursor(
        new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1)
      );
    }

    const days = buildMonthDays(monthCursor);
    const display = selected ? formatter.format(selected) : "";
    const headerLabel =
      view === "months"
        ? String(monthCursor.getFullYear())
        : monthYearFormatter.format(monthCursor);

    function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
    }

    const calendar =
      open && !disabled
        ? createPortal(
            <div
              ref={popoverRef}
              id={popupId}
              role="dialog"
              aria-modal="false"
              aria-label={t("datepicker.chooseDate")}
              className={cn(
                "relative z-[70] max-w-full select-none rounded border border-erp-datepicker-popover-border",
                "bg-erp-datepicker-popover-bg text-[0.875rem] text-erp-text",
                "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)]"
              )}
              style={{ position: "fixed", top: coords.top, left: coords.left }}
            >
              <div className="flex flex-col gap-2 p-2">
                <nav className="flex items-center">
                  <NavButton
                    label={
                      view === "months"
                        ? t("datepicker.previousYear")
                        : t("datepicker.previousMonth")
                    }
                    onClick={() => shiftCursor(-1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  </NavButton>
                  <NavButton
                    label={
                      view === "months"
                        ? t("datepicker.nextYear")
                        : t("datepicker.nextMonth")
                    }
                    onClick={() => shiftCursor(1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </NavButton>
                  <button
                    type="button"
                    tabIndex={-1}
                    title={t("datepicker.selectMonth")}
                    className="min-w-0 flex-1 truncate border-0 bg-transparent px-1 text-start text-[0.675rem] text-erp-text opacity-75 hover:opacity-100"
                    onClick={() =>
                      setView((current) => (current === "days" ? "months" : "days"))
                    }
                  >
                    <strong className="font-semibold">{headerLabel}</strong>
                  </button>
                </nav>

                {view === "months" ? (
                  <div className="grid w-[17rem] grid-cols-3 gap-0.5">
                    {Array.from({ length: 12 }, (_, month) => {
                      const isCurrentMonth = monthCursor.getMonth() === month;
                      const isSelectedMonth =
                        selected?.getMonth() === month &&
                        selected.getFullYear() === monthCursor.getFullYear();
                      return (
                        <button
                          key={month}
                          type="button"
                          className={cn(
                            "h-9 rounded border-0 bg-transparent text-[0.875rem] text-erp-text hover:bg-erp-menu-hover",
                            isCurrentMonth && "font-bold",
                            isSelectedMonth &&
                              "bg-erp-primary font-bold text-erp-primary-foreground hover:bg-erp-primary"
                          )}
                          onClick={() => {
                            setMonthCursor(new Date(monthCursor.getFullYear(), month, 1));
                            setView("days");
                          }}
                        >
                          {monthFormatter.format(
                            new Date(monthCursor.getFullYear(), month, 1)
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="grid w-[17rem] overflow-hidden rounded"
                    style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}
                    role="grid"
                  >
                    <div
                      className="col-span-8 grid bg-erp-datepicker-weekday-bg"
                      style={{ gridTemplateColumns: "subgrid" }}
                    >
                      <div
                        className="flex h-7 items-center justify-center overflow-hidden font-bold text-erp-label"
                        title={t("datepicker.weekNumbers")}
                      >
                        <div className="truncate text-[0.8125rem]" />
                      </div>
                      {weekdayLabels.map((label, index) => (
                        <div
                          key={`${label}-${index}`}
                          className="flex h-7 items-center justify-center overflow-hidden font-bold text-erp-text"
                        >
                          <div className="truncate text-[0.8125rem]">{label}</div>
                        </div>
                      ))}
                    </div>
                    {Array.from({ length: 6 }, (_, week) => {
                      const weekDays = days.slice(week * 7, week * 7 + 7);
                      return (
                        <div
                          key={week}
                          className="col-span-8 grid"
                          style={{ gridTemplateColumns: "subgrid" }}
                        >
                          <div className="flex h-8 items-center justify-center bg-erp-datepicker-week-bg text-[0.675rem] font-semibold text-erp-text">
                            {isoWeek(weekDays[0]!)}
                          </div>
                          {weekDays.map((date) => (
                            <DayCell
                              key={toISODate(date)}
                              date={date}
                              monthCursor={monthCursor}
                              selected={selected}
                              isDisabledDay={isDisabledDay}
                              onSelect={selectDay}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <PopoverArrow placement={coords.placement} offset={coords.arrowOffset} />
            </div>,
            document.body
          )
        : null;

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
              chrome,
              chromeEdge,
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
              aria-label={t("datepicker.clear")}
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
        {calendar}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
