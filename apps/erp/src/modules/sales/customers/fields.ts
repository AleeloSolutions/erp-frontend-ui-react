/**
 * The customer form as data.
 *
 * One schema, rendered by `RecordFormFields`, so the create page, the edit
 * page and the quick-create modal behind the sale's customer picker all show
 * the same form and cannot drift apart. The names are the API's field names,
 * which is also what `customerFormSchema` validates and what an API field
 * error is keyed by.
 */

import type { FieldSpec } from "@erp/ui";

export const customerFields: FieldSpec[] = [
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
    // The identifying field carries the tick, as everywhere else.
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
  {
    kind: "email",
    name: "email",
    label: "Email",
    section: "Basic information",
    span: 6,
  },
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
