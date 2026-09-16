import { useId, type ReactNode } from "react";
import { cn } from "../../utils";
import { Radio } from "../../primitives/Radio";
import { FormField } from "../Form/FormField";
import { FormGrid } from "../Form/FormGrid";
import { FormSection } from "../Form/FormSection";
import { FormCheckbox } from "../Form/fields/FormCheckbox";
import { FormDatePicker } from "../Form/fields/FormDatePicker";
import { FormInput } from "../Form/fields/FormInput";
import { FormSelect } from "../Form/fields/FormSelect";
import { FormTextarea } from "../Form/fields/FormTextarea";
import type { FieldAdapter, FieldOption, FieldSpec } from "./types";

export interface RecordFormFieldsProps {
  fields: FieldSpec[];
  adapter: FieldAdapter;
  /** Async/derived option lists, keyed by `optionsKey` — e.g. `{ taxes: [...] }`. */
  options?: Record<string, FieldOption[]>;
  readOnly?: boolean;
}

type FieldGroup = { section?: string; fields: FieldSpec[] };

/** Runs of consecutive fields sharing a `section`, in declaration order. */
function groupFields(fields: FieldSpec[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  fields.forEach((field) => {
    const last = groups[groups.length - 1];
    if (last && last.section === field.section) {
      last.fields.push(field);
      return;
    }
    groups.push({ section: field.section, fields: [field] });
  });
  return groups;
}

function resolveOptions(
  spec: Extract<FieldSpec, { kind: "select" }>,
  options: Record<string, FieldOption[]> | undefined
): FieldOption[] {
  if (spec.options) return spec.options;
  // Resolved at render time, so a schema stays static and serialisable even
  // when its choices come from a live query.
  if (spec.optionsKey) return options?.[spec.optionsKey] ?? [];
  return [];
}

function SchemaField({
  spec,
  adapter,
  options,
  readOnly,
  fieldId,
}: {
  spec: FieldSpec;
  adapter: FieldAdapter;
  options?: Record<string, FieldOption[]>;
  readOnly: boolean;
  fieldId: string;
}) {
  const error = adapter.error(spec.name);
  const span = spec.span ?? 6;

  if (spec.kind === "checkbox") {
    // The box carries its own label, Odoo-style — no left-hand label column.
    return (
      <FormField span={span} error={error}>
        <FormCheckbox id={fieldId} label={spec.label} {...adapter.field(spec.name)} />
      </FormField>
    );
  }

  if (spec.kind === "radio") {
    const first = spec.options[0];
    return (
      <FormField
        label={spec.label}
        htmlFor={first ? `${fieldId}-${first.value}` : undefined}
        span={span}
        error={error}
      >
        <div className="flex flex-wrap items-center gap-6 pt-1">
          {spec.options.map((option) => (
            <Radio
              key={option.value}
              id={`${fieldId}-${option.value}`}
              value={option.value}
              label={option.label}
              {...adapter.field(spec.name)}
            />
          ))}
        </div>
      </FormField>
    );
  }

  if (spec.kind === "custom") {
    return (
      <FormField
        label={spec.label}
        description={spec.description}
        span={span}
        error={error}
      >
        {spec.render({ name: spec.name, disabled: readOnly })}
      </FormField>
    );
  }

  if (spec.kind === "select") {
    return (
      <FormField
        label={spec.label}
        htmlFor={fieldId}
        description={spec.description}
        required={spec.required}
        span={span}
        error={error}
      >
        <FormSelect
          id={fieldId}
          error={Boolean(error)}
          options={resolveOptions(spec, options)}
          chrome={spec.chrome}
          chromeEdge={spec.chromeEdge}
          {...adapter.field(spec.name)}
        />
      </FormField>
    );
  }

  const shared = {
    id: fieldId,
    error: Boolean(error),
    chrome: spec.chrome,
    chromeEdge: spec.chromeEdge,
  };
  const fieldProps = adapter.field(
    spec.name,
    spec.valueAsNumber ? { valueAsNumber: true } : undefined
  );

  let control: ReactNode;
  if (spec.kind === "textarea") {
    control = (
      <FormTextarea
        {...shared}
        placeholder={spec.placeholder}
        maxLength={spec.maxLength}
        {...fieldProps}
      />
    );
  } else if (spec.kind === "date") {
    control = (
      <FormDatePicker
        {...shared}
        placeholder={spec.placeholder}
        min={spec.min}
        max={spec.max}
        {...fieldProps}
      />
    );
  } else {
    control = (
      <FormInput
        {...shared}
        type={spec.kind}
        placeholder={spec.placeholder}
        maxLength={spec.maxLength}
        min={spec.min}
        max={spec.max}
        step={spec.kind === "number" ? spec.step : undefined}
        {...fieldProps}
      />
    );
  }

  return (
    <FormField
      label={spec.label}
      htmlFor={fieldId}
      description={spec.description}
      required={spec.required}
      span={span}
      error={error}
    >
      {control}
    </FormField>
  );
}

/**
 * Renders a declarative field schema with the existing form primitives, so an
 * entity's form is data rather than JSX.
 *
 * It holds no form state and imports no form library: every value, change
 * handler and message arrives through `adapter` (the app owns RHF). Anything
 * the schema cannot describe goes through `kind: "custom"`.
 */
export function RecordFormFields({
  fields,
  adapter,
  options,
  readOnly = false,
}: RecordFormFieldsProps) {
  const uid = useId();
  const groups = groupFields(fields);

  return (
    <fieldset disabled={readOnly} className="m-0 min-w-0 border-0 p-0">
      {groups.map((group, index) => {
        const grid = (
          <FormGrid columns={12}>
            {group.fields.map((spec) => (
              <SchemaField
                key={spec.name}
                spec={spec}
                adapter={adapter}
                options={options}
                readOnly={readOnly}
                fieldId={`${uid}${spec.name}`}
              />
            ))}
          </FormGrid>
        );

        if (group.section) {
          return (
            <FormSection key={`${group.section}-${index}`} title={group.section}>
              {grid}
            </FormSection>
          );
        }

        return (
          <div
            key={`unsectioned-${index}`}
            className={cn(
              "p-[13px]",
              index < groups.length - 1 && "border-b border-erp-border"
            )}
          >
            {grid}
          </div>
        );
      })}
    </fieldset>
  );
}
