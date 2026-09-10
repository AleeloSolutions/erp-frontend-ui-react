/** Inclusive calendar range as `YYYY-MM-DD`. */
export type DateRange = { from: string; to: string };

/** Legacy preset ids (still resolved if present in saved searches). */
export type DatePresetId =
  "current_month" | "last_2_months" | "q1" | "q2" | "q3" | "q4" | "last_3_years";

export type PeriodGrain = "year" | "quarter" | "month" | "week" | "day";

const CUSTOM_PREFIX = "custom:";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

function quarterRange(year: number, quarter: 1 | 2 | 3 | 4): DateRange {
  const startMonth = (quarter - 1) * 3;
  return {
    from: toISODate(startOfMonth(year, startMonth)),
    to: toISODate(endOfMonth(year, startMonth + 2)),
  };
}

/** `month:YYYY-MM` */
export function encodeMonthToken(year: number, monthIndex: number): string {
  return `month:${year}-${pad2(monthIndex + 1)}`;
}

/** `quarter:YYYY-Qn` */
export function encodeQuarterToken(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `quarter:${year}-Q${quarter}`;
}

/** `year:YYYY` */
export function encodeYearToken(year: number): string {
  return `year:${year}`;
}

export function parseMonthToken(token: string): DateRange | null {
  const match = /^month:(\d{4})-(\d{2})$/.exec(token);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return {
    from: toISODate(startOfMonth(year, monthIndex)),
    to: toISODate(endOfMonth(year, monthIndex)),
  };
}

export function parseQuarterToken(token: string): DateRange | null {
  const match = /^quarter:(\d{4})-Q([1-4])$/.exec(token);
  if (!match) return null;
  return quarterRange(Number(match[1]), Number(match[2]) as 1 | 2 | 3 | 4);
}

export function parseYearToken(token: string): DateRange | null {
  const match = /^year:(\d{4})$/.exec(token);
  if (!match) return null;
  const year = Number(match[1]);
  return {
    from: toISODate(startOfMonth(year, 0)),
    to: toISODate(endOfMonth(year, 11)),
  };
}

/** Calendar “Last 2 Months”: start of previous month → end of current month. */
export function resolveDatePreset(id: DatePresetId, now: Date = new Date()): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (id) {
    case "current_month":
      return {
        from: toISODate(startOfMonth(year, month)),
        to: toISODate(endOfMonth(year, month)),
      };
    case "last_2_months": {
      const start = startOfMonth(year, month - 1);
      return {
        from: toISODate(start),
        to: toISODate(endOfMonth(year, month)),
      };
    }
    case "q1":
      return quarterRange(year, 1);
    case "q2":
      return quarterRange(year, 2);
    case "q3":
      return quarterRange(year, 3);
    case "q4":
      return quarterRange(year, 4);
    case "last_3_years":
      return {
        from: toISODate(startOfMonth(year - 2, 0)),
        to: toISODate(endOfMonth(year, 11)),
      };
  }
}

export function isDatePresetId(value: string): value is DatePresetId {
  return (
    value === "current_month" ||
    value === "last_2_months" ||
    value === "q1" ||
    value === "q2" ||
    value === "q3" ||
    value === "q4" ||
    value === "last_3_years"
  );
}

export function encodeCustomRange(from: string, to: string): string {
  return `${CUSTOM_PREFIX}${from}:${to}`;
}

export function parseCustomRange(value: string): DateRange | null {
  if (!value.startsWith(CUSTOM_PREFIX)) return null;
  const rest = value.slice(CUSTOM_PREFIX.length);
  const match = /^(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(rest);
  if (!match) return null;
  return { from: match[1], to: match[2] };
}

export function isCustomRangeValue(value: string): boolean {
  return parseCustomRange(value) != null;
}

/** Resolve a selected filter token to a range. */
export function resolveDateFilterToken(
  token: string,
  now: Date = new Date()
): DateRange | null {
  return (
    parseMonthToken(token) ??
    parseQuarterToken(token) ??
    parseYearToken(token) ??
    (isDatePresetId(token) ? resolveDatePreset(token, now) : null) ??
    parseCustomRange(token)
  );
}

export function encodeDateRangesQuery(
  tokens: string[],
  now: Date = new Date()
): string {
  const ranges = tokens
    .map((token) => resolveDateFilterToken(token, now))
    .filter((range): range is DateRange => range != null);
  if (ranges.length === 0) return "";
  return ranges.map((range) => `${range.from}..${range.to}`).join("|");
}

/** True when `isoDate` falls in any of the selected tokens (OR semantics, Odoo-style). */
export function dateMatchesFilterTokens(
  isoDate: string,
  tokens: string[],
  now: Date = new Date()
): boolean {
  if (tokens.length === 0) return true;
  const day = isoDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return tokens.some((token) => {
    const range = resolveDateFilterToken(token, now);
    if (!range) return false;
    return day >= range.from && day <= range.to;
  });
}

const PRESET_LABELS: Record<DatePresetId, string> = {
  current_month: "Current Month",
  last_2_months: "Last 2 Months",
  q1: "Q1",
  q2: "Q2",
  q3: "Q3",
  q4: "Q4",
  last_3_years: "Last 3 Years",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function labelForDateFilterToken(token: string): string {
  const month = /^month:(\d{4})-(\d{2})$/.exec(token);
  if (month) {
    const monthIndex = Number(month[2]) - 1;
    return MONTH_NAMES[monthIndex] ?? token;
  }
  const quarter = /^quarter:(\d{4})-Q([1-4])$/.exec(token);
  if (quarter) return `Q${quarter[2]}`;
  const year = /^year:(\d{4})$/.exec(token);
  if (year) return year[1];
  if (isDatePresetId(token)) return PRESET_LABELS[token];
  const custom = parseCustomRange(token);
  if (custom) return `${custom.from} – ${custom.to}`;
  return token;
}

/**
 * Odoo Create Date options: last 3 months, Q4→Q1, separator, last 3 years.
 * Generated relative to `now`.
 */
export function buildOdooDateFilterOptions(now: Date = new Date()): {
  value: string;
  label: string;
  dividerBefore?: boolean;
}[] {
  const options: { value: string; label: string; dividerBefore?: boolean }[] = [];

  for (let offset = 0; offset < 3; offset += 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    options.push({
      value: encodeMonthToken(year, monthIndex),
      label: MONTH_NAMES[monthIndex],
    });
  }

  const year = now.getFullYear();
  for (let q = 4; q >= 1; q -= 1) {
    options.push({
      value: encodeQuarterToken(year, q as 1 | 2 | 3 | 4),
      label: `Q${q}`,
    });
  }

  for (let offset = 0; offset < 3; offset += 1) {
    const y = year - offset;
    options.push({
      value: encodeYearToken(y),
      label: String(y),
      dividerBefore: offset === 0,
    });
  }

  return options;
}

/** ISO week number (Mon-start), matching Odoo week grouping. */
export function isoWeekParts(date: Date): { year: number; week: number } {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
}

export function bucketDate(isoDate: string, grain: PeriodGrain): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  switch (grain) {
    case "year":
      return String(year);
    case "quarter":
      return `${year}-Q${Math.ceil(month / 3)}`;
    case "month":
      return `${year}-${pad2(month)}`;
    case "week": {
      const { year: weekYear, week } = isoWeekParts(date);
      return `${weekYear}-W${pad2(week)}`;
    }
    case "day":
      return `${year}-${pad2(month)}-${pad2(day)}`;
  }
}

export function formatPeriodBucket(key: string, grain: PeriodGrain): string {
  switch (grain) {
    case "year":
      return key;
    case "quarter": {
      const m = /^(\d{4})-Q([1-4])$/.exec(key);
      return m ? `Q${m[2]} ${m[1]}` : key;
    }
    case "month": {
      const m = /^(\d{4})-(\d{2})$/.exec(key);
      if (!m) return key;
      const date = new Date(Number(m[1]), Number(m[2]) - 1, 1);
      return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    case "week": {
      const m = /^(\d{4})-W(\d{2})$/.exec(key);
      return m ? `W${m[2]} ${m[1]}` : key;
    }
    case "day":
      return formatPeriodBucketDay(key);
  }
}

function formatPeriodBucketDay(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Period group column id: `__period:<grain>:<dateField>`. */
export function periodGroupingColumnId(grain: PeriodGrain, dateField: string): string {
  return `__period:${grain}:${dateField}`;
}

export function parsePeriodGroupingColumnId(
  columnId: string
): { grain: PeriodGrain; dateField: string } | null {
  const match = /^__period:(year|quarter|month|week|day):(.+)$/.exec(columnId);
  if (!match) return null;
  return { grain: match[1] as PeriodGrain, dateField: match[2] };
}

const GRAIN_ORDER: PeriodGrain[] = ["year", "quarter", "month", "week", "day"];

/** Stable Odoo-like order for nested period grouping (Year → … → Day). */
export function sortPeriodGrains(grains: PeriodGrain[]): PeriodGrain[] {
  return [...grains].sort((a, b) => GRAIN_ORDER.indexOf(a) - GRAIN_ORDER.indexOf(b));
}

export const PERIOD_GROUP_TREE: { id: PeriodGrain; label: string }[] = [
  { id: "year", label: "Year" },
  { id: "quarter", label: "Quarter" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];
