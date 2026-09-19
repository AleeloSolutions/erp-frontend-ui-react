/**
 * The product form as data.
 *
 * Shared by the edit page and the quick-create modal behind the sale line's
 * product picker, so "New product" asks for exactly what editing one shows.
 * `default_tax` takes its choices from the tenant's tax list at render time
 * through `optionsKey`, which keeps this schema static.
 *
 * **Deliberately minimal while the real field list is undecided.** `code` is
 * still a column and the API still accepts it; it is simply not asked for
 * during testing.
 *
 * Quantity on hand and an image are wanted here too, but neither exists as a
 * column yet -- unlike the omissions above, those need a migration rather
 * than a line in this file.
 */

import type { FieldSpec } from "@erp/ui";

export const productFields: FieldSpec[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    span: 6,
    chrome: "underline",
  },
  {
    kind: "number",
    name: "unit_price",
    label: "Price per item",
    span: 6,
    min: 0,
    // Money is decimal; without this the browser assumes whole numbers and
    // refuses to submit 12.50.
    step: "0.01",
    // No `valueAsNumber`: money stays the string the API takes and
    // `productFormSchema` validates -- parsing it here would lose what was
    // typed.
    chrome: "underline",
  },
  {
    kind: "select",
    name: "default_tax",
    label: "Tax",
    span: 6,
    optionsKey: "taxes",
    chrome: "underline",
  },
];
