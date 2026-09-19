/**
 * The customer form as data.
 *
 * One schema, rendered by `RecordFormFields`, so the create page, the edit
 * page and the quick-create modal behind the sale's customer picker all show
 * the same form and cannot drift apart. The names are the API's field names,
 * which is also what `customerFormSchema` validates and what an API field
 * error is keyed by.
 *
 * **Deliberately minimal while the real field list is undecided.** The
 * columns behind the omitted fields are all still there -- customer_type,
 * tax_number, mobile, currency, payment_terms_days, the rest of the address
 * and notes -- and the API still accepts them; they are simply not asked for
 * during testing. Nothing was migrated away, so restoring one is a line here,
 * not a schema change. `CUSTOMER_FIELDS_FULL` below keeps that set within
 * reach.
 *
 * `address_line1` carries the whole address for now, which is why it is
 * labelled plainly "Address".
 */

import type { FieldSpec } from "@erp/ui";

export const customerFields: FieldSpec[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    span: 6,
    chrome: "tick",
    chromeEdge: "end",
  },
  { kind: "text", name: "phone", label: "Phone", span: 6 },
  { kind: "email", name: "email", label: "Email", span: 6 },
  { kind: "text", name: "address_line1", label: "Address", span: 6 },
];

/**
 * The fuller form this was cut down from. Not rendered anywhere today; kept
 * so the decision can be reversed by swapping which one a page imports,
 * rather than by reconstructing it from the migration history.
 */
export const CUSTOMER_FIELDS_FULL: FieldSpec[] = [
  {
    kind: "radio",
    name: "customer_type",
    label: "Type",
    section: "Basic information",
    span: 12,
    options: [
      { value: "organization", label: "Organization" },
      { value: "person", label: "Person" },
    ],
  },
  {
    kind: "text",
    name: "name",
    label: "Customer name",
    section: "Basic information",
    required: true,
    span: 6,
    chrome: "tick",
    chromeEdge: "end",
  },
  {
    kind: "text",
    name: "tax_number",
    label: "Tax number",
    section: "Basic information",
    span: 6,
  },
  { kind: "email", name: "email", label: "Email", section: "Basic information", span: 6 },
  { kind: "text", name: "phone", label: "Phone", section: "Basic information", span: 6 },
  {
    kind: "text",
    name: "mobile",
    label: "Mobile",
    section: "Basic information",
    span: 6,
  },
  {
    kind: "text",
    name: "currency",
    label: "Currency",
    section: "Billing",
    span: 6,
    maxLength: 3,
    description: "Three-letter code, e.g. USD.",
  },
  {
    kind: "number",
    name: "payment_terms_days",
    label: "Payment terms",
    section: "Billing",
    span: 6,
    min: 0,
    valueAsNumber: true,
    description: "Days until a sale falls due. Zero means on receipt.",
  },
  {
    kind: "text",
    name: "address_line1",
    label: "Address line 1",
    section: "Address",
    span: 6,
  },
  {
    kind: "text",
    name: "address_line2",
    label: "Address line 2",
    section: "Address",
    span: 6,
  },
  { kind: "text", name: "city", label: "City", section: "Address", span: 6 },
  { kind: "text", name: "state", label: "State or region", section: "Address", span: 6 },
  {
    kind: "text",
    name: "postal_code",
    label: "Postal code",
    section: "Address",
    span: 6,
  },
  {
    kind: "text",
    name: "country",
    label: "Country",
    section: "Address",
    span: 6,
    maxLength: 2,
    description: "Two-letter code, e.g. SO.",
  },
  { kind: "textarea", name: "notes", label: "Notes", section: "Notes", span: 12 },
];
