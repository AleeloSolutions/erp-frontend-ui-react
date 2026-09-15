import { useEffect, useState } from "react";
import { Button } from "../../primitives/Button";
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
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const [openField, setOpenField] = useState<"from" | "to" | null>(null);

  useEffect(() => {
    setFromValue(from);
  }, [from]);

  useEffect(() => {
    setToValue(to);
  }, [to]);

  return (
    <div className="flex flex-col gap-2 pe-1 pt-0.5">
      <DatePicker
        size="sm"
        value={fromValue}
        max={toValue || undefined}
        open={openField === "from"}
        onOpenChange={(next) => setOpenField(next ? "from" : null)}
        onChange={(event) => {
          const next = { from: event.target.value, to: toValue };
          setFromValue(next.from);
          onChange(next);
        }}
        placeholder={t("searchFilter.dateFrom")}
      />
      <DatePicker
        size="sm"
        value={toValue}
        min={fromValue || undefined}
        open={openField === "to"}
        onOpenChange={(next) => setOpenField(next ? "to" : null)}
        onChange={(event) => {
          const next = { from: fromValue, to: event.target.value };
          setToValue(next.to);
          onChange(next);
        }}
        placeholder={t("searchFilter.dateTo")}
      />
      <Button type="button" variant="secondary" size="sm" className="w-full">
        {t("searchFilter.submit")}
      </Button>
    </div>
  );
}
