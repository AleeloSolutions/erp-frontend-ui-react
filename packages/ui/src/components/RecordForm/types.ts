import type { ReactNode } from "react";
import type { FieldChrome, FieldChromeEdge } from "../../utils";
import type { FormFieldSpan } from "../../types/forms";

export type FieldOption = { value: string; label: string };

/** Fields shared by every kind. */
type FieldBase = {
  /** Path handed to the adapter — the app decides what it means. */
  name: string;
  /** Groups consecutive fields under one `FormSection`. */
  section?: string;
  /** Grid columns out of 12. Defaults to 6. */
  span?: FormFieldSpan;
};

type TextLikeKind = "text" | "email" | "number" | "textarea" | "date";

export type FieldSpec =
  | (FieldBase & {
      kind: TextLikeKind;
      label: string;
      required?: boolean;
      description?: string;
      placeholder?: string;
      maxLength?: number;
      min?: number | string;
      max?: number | string;
      /**
       * Granularity for `kind: "number"`. Without it the browser assumes
       * whole numbers and rejects a decimal on submit, so money wants
       * `step="0.01"`.
       */
      step?: number | string;
      valueAsNumber?: boolean;
      /** Field border treatment, e.g. `chrome="tick"` on the identifying field. */
      chrome?: FieldChrome;
      chromeEdge?: FieldChromeEdge;
    })
  | (FieldBase & {
      kind: "select";
      label: string;
      required?: boolean;
      description?: string;
      options?: FieldOption[];
      /** Resolved against the `options` prop at render time — see below. */
      optionsKey?: string;
      chrome?: FieldChrome;
      chromeEdge?: FieldChromeEdge;
    })
  | (FieldBase & { kind: "checkbox"; label: string })
  | (FieldBase & { kind: "radio"; label: string; options: FieldOption[] })
  | (FieldBase & {
      kind: "custom";
      label?: string;
      description?: string;
      render: (ctx: { name: string; disabled: boolean }) => ReactNode;
    });

/**
 * Bridge between the schema and whatever form library the app uses.
 * `packages/ui` deliberately owns neither — the app supplies an
 * RHF-backed implementation, e.g.
 *
 * ```ts
 * const adapter: FieldAdapter = {
 *   field: (name, opts) => ({ ...register(name, opts) }),
 *   error: (name) => errors[name]?.message,
 * };
 * ```
 */
export interface FieldAdapter {
  /** Props to spread onto the control — the app supplies an RHF-backed implementation. */
  field: (name: string, opts?: { valueAsNumber?: boolean }) => Record<string, unknown>;
  error: (name: string) => string | undefined;
}
