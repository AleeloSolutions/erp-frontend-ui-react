import { DatePicker } from "../../primitives/DatePicker";
import { useUiTranslation } from "../../i18n";

export function CustomRangeFields({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const { t } = useUiTranslation("ui");

  return (
    <div className="flex flex-col gap-1.5 pe-1">
      <label className="flex flex-col gap-0.5 text-[11px] text-erp-muted">
        <span>{t("searchFilter.dateFrom")}</span>
        <DatePicker
          size="sm"
          value={from}
          max={to || undefined}
          onChange={(event) => onChange({ from: event.target.value, to })}
          placeholder={t("searchFilter.dateFrom")}
        />
      </label>
      <label className="flex flex-col gap-0.5 text-[11px] text-erp-muted">
        <span>{t("searchFilter.dateTo")}</span>
        <DatePicker
          size="sm"
          value={to}
          min={from || undefined}
          onChange={(event) => onChange({ from, to: event.target.value })}
          placeholder={t("searchFilter.dateTo")}
        />
      </label>
    </div>
  );
}
