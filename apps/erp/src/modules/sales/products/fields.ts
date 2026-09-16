/**
 * The product form as data — the MVP catalogue fields.
 *
 * Shared by the edit page and the quick-create modal behind the sale line's
 * product picker, so "New product" asks for exactly what editing one shows.
 * `default_tax` takes its choices from the tenant's tax list at render time
 * through `optionsKey`, which keeps this schema static.
 */

import type { FieldSpec } from "@erp/ui";

export const productFields: FieldSpec[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    span: 12,
    chrome: "underline",
  },
  { kind: "text", name: "code", label: "Code", span: 12, chrome: "underline" },
  {
    kind: "number",
    name: "unit_price",
    label: "Unit price",
    span: 12,
    min: 0,
    // Money is decimal; without this the browser assumes whole numbers and
    // refuses to submit 12.50.
    step: "0.01",
    // No `valueAsNumber`: money stays the string the API takes and
    // `productFormSchema` validates — parsing it here would lose what was typed.
    chrome: "underline",
  },
  {
    kind: "select",
    name: "default_tax",
    label: "Default tax",
    span: 12,
    optionsKey: "taxes",
    chrome: "underline",
  },
];
