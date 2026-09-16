/**
 * React Hook Form, expressed as a `FieldAdapter`.
 *
 * `@erp/ui` renders a `FieldSpec[]` but deliberately owns no form library —
 * the app owns RHF (docs/REGISTRY.md) — so this is the single seam between
 * the two. A schema-driven form needs exactly two things from RHF: the props
 * that register a control, and the message for a field. Both pass through
 * here, and nothing else about RHF reaches the design system.
 */

import type { FieldAdapter } from "@erp/ui";
import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

/**
 * The message at a dotted path, so a nested field name resolves the way RHF
 * itself resolves it. Anything that is not a string message reads as no error.
 */
function messageAt(errors: unknown, name: string): string | undefined {
  const node = name.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, errors);
  if (node === null || typeof node !== "object") return undefined;
  const message = (node as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

/**
 * Binds a `useForm`'s `register` and `formState.errors` to the renderer.
 *
 * ```tsx
 * <RecordFormFields fields={customerFields} adapter={rhfAdapter(register, errors)} />
 * ```
 */
export function rhfAdapter<TValues extends FieldValues>(
  register: UseFormRegister<TValues>,
  errors: FieldErrors<TValues>
): FieldAdapter {
  return {
    field: (name, opts) =>
      register(
        name as FieldPath<TValues>,
        // Passed on only when the schema asks for it: under `valueAsNumber`
        // RHF hands an empty input back as NaN, which no text field wants.
        opts?.valueAsNumber ? { valueAsNumber: true } : undefined
      ),
    error: (name) => messageAt(errors, name),
  };
}
