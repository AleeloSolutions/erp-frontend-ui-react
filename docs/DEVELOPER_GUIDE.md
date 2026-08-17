# ERP Frontend — Developer Guide

How to build pages with this component system — without reinventing UI.

**Contracts**

| Doc                                            | Purpose                            |
| ---------------------------------------------- | ---------------------------------- |
| [`ERP_UI_STANDARDS.md`](./ERP_UI_STANDARDS.md) | Target standards + v1.1 amendments |
| [`REGISTRY.md`](./REGISTRY.md)                 | Component approval status          |
| [`RTL.md`](./RTL.md)                           | RTL-ready rules                    |

**Live demos**

| What                       | URL / command          |
| -------------------------- | ---------------------- |
| All components (Storybook) | `npm run storybook`    |
| In-app catalog (temporary) | `/components-demo`     |
| Example module (list)      | `/sales/customers`     |
| Example module (create)    | `/sales/customers/new` |

**Run locally**

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run storybook   # http://localhost:6006
npm run test        # Vitest (packages/ui)
```

---

## 1. Mental model (read this first)

This repo is a **design system + ERP app** monorepo. Business rules stay in `apps/erp`. Shared UI stays in `packages/ui`.

| Layer                          | Job                                              | Put business rules here? |
| ------------------------------ | ------------------------------------------------ | ------------------------ |
| `packages/ui/src/primitives`   | Buttons, inputs, select, checkbox…               | No                       |
| `packages/ui/src/components`   | DataTable, Form, Modal, Drawer, Toast…           | No                       |
| `packages/ui/src/layout`       | Generic AppShell, Sidebar, Header, PageContainer | No                       |
| `apps/erp/src/modules/*/api`   | Mock/real API + React Query hooks                | Light mapping only       |
| `apps/erp/src/modules/*/pages` | Compose UI + call hooks                          | Yes — page/module config |
| `apps/erp/src/modules/*`       | Schemas, column defs, feature helpers            | Yes                      |

**Golden rule:** Generic components accept **props / config**. They must not know “invoice”, “payroll”, etc.

### Design-system rules

1. Import shared UI from `@erp/ui` only. Do not rebuild primitives or DataTable patterns inside modules.
2. Theme via tokens in `packages/ui/src/tokens/` (semantic roles like `primary`, `secondary`, `danger`). Do not hardcode hex colors in modules or invent one-off colors in `@erp/ui` components.
3. Never ship fake interactive chrome (e.g. a three-dots button with no menu). If there is no behavior, omit the control.
4. Storybook (`npm run storybook`) is the primary reference for how `@erp/ui` behaves. Add stories for real API states when you change shared components.
5. Modules own business decisions (which row actions exist, API calls, permissions). `@erp/ui` owns reusable presentation and interaction patterns.
6. DataTable:
   - `getRowActions={(row) => [...]}` for a MoreHorizontal menu of contextual actions
   - custom `__actions` column for a single direct action (e.g. delete icon)
   - `tableId="customers-list"` to persist column widths per table in `localStorage`

**Recipe for almost every list page:**

```tsx
<AppShell>
  <PageHeader title="…" actions={…} />
  <PageSubmenu … />
  <DataTable columns={…} data={…} />
</AppShell>
```

**Recipe for almost every create/edit page:**

```tsx
<AppShell>
  <PageHeader title="…" />
  <FormShell onSubmit={…} actionProps={…}>
    <FormSection>
      <FormGrid>
        <FormField><FormInput … /></FormField>
      </FormGrid>
    </FormSection>
  </FormShell>
</AppShell>
```

Best real example in the repo: `apps/erp/src/modules/sales/pages/CustomersPage.tsx`.

---

## 2. Folder map

```text
packages/ui/src/
  tokens/               # colors, spacing, typography
  primitives/           # Button, Input, Select, Checkbox, DatePicker, …
  components/           # DataTable, Form, Modal, Drawer, Toast, …
  layout/               # AppShell, Sidebar, Header, PageContainer
  hooks/                # useDebounce, useDataTable, useDisclosure
  utils/                # cn(), formatDate, formatCurrency
  index.ts              # public @erp/ui exports

apps/erp/src/
  main.tsx              # Vite entry
  routes.tsx            # App shell routes; mounts module route trees
  modules/
    sales/routes.tsx    # Sales routes under /sales/*
    inventory/routes.tsx
  app/                  # providers, ERP AppShell defaults, navigation, home/demo
  lib/                  # api-client, query-client, mock delay
  modules/
    accounting|sales|procurement|hr/
      pages/
      components/       # module-specific compositions ONLY
      api/              # DRF/mock functions + React Query hooks
```

---

## 3. Stack

| Tool                  | Use for                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Vite + React Router   | SPA pages & layouts                                                |
| TypeScript            | Required everywhere in app code                                    |
| Tailwind CSS v4       | Styling (`erp-*` tokens in `packages/ui/src/tokens/`) — **locked** |
| Storybook             | Component review / approval surface                                |
| Lucide React          | Icons (no emoji / Unicode icons)                                   |
| TanStack Table **v8** | DataTable                                                          |
| React Hook Form + Zod | Forms & validation (app/modules)                                   |
| TanStack Query        | Server/mock data fetching                                          |
| i18next               | Translation keys (`common.*`, `ui.*`)                              |
| Vitest + RTL          | `@erp/ui` unit/component tests                                     |

Providers are wired in `apps/erp/src/main.tsx` via `AppProviders` (Query + Toast + i18n). App-level routes live in `apps/erp/src/routes.tsx`; each module registers its own routes in `modules/<name>/routes.tsx` and is mounted under a path prefix (e.g. `/sales/*`).

### Naming (new APIs)

- Prefer `isOpen`, `isDisabled`, `isLoading`, `isRequired`, `hasError` on **new** props.
- Do not mass-rename grandfathered props (`open`, `loading`, …) without an approved breaking change.

### i18n

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation("common");
t("save"); // common.save
```

UI chrome keys live under the `ui` namespace. See `apps/erp/src/lib/i18n.ts` and `packages/ui/src/i18n/`.

---

## 4. Layout

### AppShell

Wraps every authenticated-looking page: sidebar + mobile nav + main area.

```tsx
import { AppShell } from "@/app";

export default function Page() {
  return (
    <AppShell activeNavKey="sales" activeMobileKey="tasks">
      {/* page content */}
    </AppShell>
  );
}
```

- `activeNavKey` — must match a key in `apps/erp/src/app/navigation.ts`
- Navigation icons live in config; keep pages free of icon wiring for the sidebar

### PageHeader

```tsx
import { Users } from "lucide-react";
import { PageHeader } from "@/app";
import { Button } from "@erp/ui";

<PageHeader
  module="Sales"
  section="Customers"
  title="Customers"
  description="Manage customers."
  icon={<Users className="h-4 w-4" aria-hidden />}
  actions={<Button variant="primary">Create</Button>}
/>;
```

**Important:** `icon` is a **React node** (`<Users … />`), not the component type.

### PageSubmenu

```tsx
import { PageSubmenu } from "@/app";
import { salesSubmenu } from "@/app/navigation";

<PageSubmenu module="Sales" items={salesSubmenu} activeKey="customers" />;
```

Add new submenu items in `apps/erp/src/app/navigation.ts`.

---

## 5. UI primitives

Import from `@erp/ui`.

| Component                       | Notes                                                                   |
| ------------------------------- | ----------------------------------------------------------------------- |
| `Button`                        | `variant`: primary, secondary, teal, danger, ghost, outline · `loading` |
| `Input` / `Select` / `Textarea` | `error` boolean for invalid state                                       |
| `Checkbox` / `Radio` / `Switch` | Controlled via normal HTML props                                        |
| `Badge` / `StatusBadge`         | StatusBadge maps status strings to colors                               |
| `Card`                          | Grouped content                                                         |
| `Modal`                         | Generic dialog                                                          |
| `ConfirmDialog`                 | Modal preset for confirm / delete                                       |
| `Drawer`                        | Side panel for detail                                                   |
| `Dropdown` / `Tooltip`          | Menus & hints                                                           |
| `Toast` + `useToast()`          | Global notifications                                                    |

### Toast

```tsx
"use client";
import { useToast } from "@erp/ui";

const { toast } = useToast();

toast({
  title: "Saved",
  description: "Customer was updated.",
  variant: "success", // success | error | info | warning
});
```

### Confirm delete

```tsx
<ConfirmDialog
  open={open}
  title="Delete customer?"
  description="This cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  loading={isPending}
  onCancel={() => setOpen(false)}
  onConfirm={handleDelete}
/>
```

---

## 6. DataTable

File: `packages/ui/src/components/DataTable/DataTable.tsx`  
Types: `packages/ui/src/types/table.ts`

### Client-side list (simple)

```tsx
"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, StatusBadge } from "@erp/ui";

type Row = { id: string; name: string; status: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
  },
];

export function MyTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchable
      selectable
      pagination
      pageSize={10}
      getRowId={(row) => row.id}
      filters={[
        {
          key: "status",
          label: "Status",
          type: "select",
          placeholder: "All statuses",
          options: [
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ],
        },
      ]}
      bulkActions={[
        {
          key: "export",
          label: "Export",
          onClick: (rows) => console.log(rows),
        },
      ]}
    />
  );
}
```

### Server / Query-backed list (recommended for modules)

Use when the API (or mock API) owns search, filters, and paging.

```tsx
<DataTable
  columns={columns}
  data={query.data?.data ?? []}
  searchable
  search={{ value: search, onChange: setSearch }}
  manualFiltering // ← important: don’t double-filter client-side
  filters={filters}
  filtering={{ state: filterValues, onChange: setFilterValues }}
  loading={query.isLoading || query.isFetching}
  error={query.isError ? query.error.message : null}
  pagination={{
    page,
    pageSize,
    total: query.data?.total ?? 0,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }}
  getRowId={(row) => row.id}
/>
```

Copy the full pattern from `apps/erp/src/modules/sales/pages/CustomersPage.tsx`.

### Useful props

| Prop                                 | Meaning                           |
| ------------------------------------ | --------------------------------- |
| `searchable`                         | Show search box                   |
| `search`                             | Controlled search value           |
| `manualFiltering`                    | Parent/API filters; table UI only |
| `filters`                            | Filter definitions                |
| `filtering`                          | Controlled filter values          |
| `selectable`                         | Row checkboxes                    |
| `bulkActions`                        | Actions for selected rows         |
| `loading` / `error` / `emptyMessage` | States                            |
| `enableColumnVisibility`             | Columns menu (default on)         |
| `enableColumnResizing`               | Drag column edges (default on)    |
| `enableGrouping` + `groupingOptions` | Group by column                   |

Custom row action column: use `id: "__actions"` so DataTable does not inject the default ⋯ button.

---

## 7. Forms

### Composition order

```text
FormShell
  └─ FormSection
       └─ FormGrid (12 columns)
            └─ FormField (span={4|6|12…})
                 └─ FormInput | FormSelect | FormTextarea | …
  └─ actionProps → FormActions (Cancel / Submit)
```

Optional: `FormStepper`, `FormSummary`, `serverError` on `FormShell`.

### Zod + React Hook Form

1. Define schema in the **module** (not inside a generic form component).
2. Wire with `zodResolver`.
3. Spread `register("field")` onto form field components.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormShell, FormSection, FormGrid, FormField, FormInput } from "@erp/ui";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type Values = z.infer<typeof schema>;

export function CreateThingForm({ onSubmit }: { onSubmit: (v: Values) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <FormShell
      title="Create"
      onSubmit={handleSubmit(onSubmit)}
      actionProps={{
        submitLabel: "Save",
        submitting: isSubmitting,
        onCancel: () => history.back(),
      }}
    >
      <FormSection title="Basic">
        <FormGrid columns={12}>
          <FormField
            label="Name"
            required
            htmlFor="name"
            error={errors.name?.message}
            span={6}
          >
            <FormInput id="name" error={Boolean(errors.name)} {...register("name")} />
          </FormField>
          <FormField
            label="Email"
            required
            htmlFor="email"
            error={errors.email?.message}
            span={6}
          >
            <FormInput
              id="email"
              type="email"
              error={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormShell>
  );
}
```

### Form field components

| Component                                   | Typical use                            |
| ------------------------------------------- | -------------------------------------- |
| `FormInput`                                 | Text / email / number                  |
| `FormSelect`                                | Dropdown (`options={[{label,value}]}`) |
| `FormTextarea`                              | Long text                              |
| `FormCheckbox` / `FormRadio` / `FormSwitch` | Booleans / choices                     |
| `FormDatePicker`                            | `type="date"`                          |
| `FormFileUpload`                            | File name / upload UI                  |

**Zod v4 note:** use `{ message: "…" }` on enums (not `required_error`).

Full demos: `apps/erp/src/app/components-demo/demo-forms.tsx`  
Module schema example: `apps/erp/src/modules/sales/customers/schema.ts`

---

## 8. Data fetching (TanStack Query)

### Pattern

```text
apps/erp/src/modules/sales/api/customers.ts     → async functions (mock or real HTTP)
apps/erp/src/modules/sales/api/query-keys.ts    → stable query keys
apps/erp/src/modules/sales/api/useCustomers.ts  → useQuery / useMutation
apps/erp/src/modules/sales/pages/...            → call hooks, pass data to UI
```

### Add a new resource (checklist)

1. **API** — `listX`, `createX`, `deleteX` in `apps/erp/src/modules/<module>/api/`
2. **Keys** — add to that module’s `api/query-keys.ts`
3. **Hooks** — `useXQuery`, `useCreateXMutation` in the same `api/` folder
4. **Page** — compose layout + table/form + toast/confirm in `pages/`

### Example hook usage

```tsx
const { data, isLoading, isError, error, isFetching } = useCustomersQuery({
  search,
  status: "all",
  page,
  pageSize,
});

const createMutation = useCreateCustomerMutation();
await createMutation.mutateAsync(payload);
// lists invalidate automatically in the hook’s onSuccess
```

Today APIs use an in-memory store + `mockDelay()` (`apps/erp/src/lib/mock.ts`). Later, swap the body of module `api/*.ts` to real `fetch` — **pages and components stay the same**.

---

## 9. Build a new module page (step by step)

Example: **Suppliers** list + create.

1. **Route**
   - `apps/erp/src/modules/procurement/pages/SuppliersPage.tsx`
   - `apps/erp/src/modules/procurement/pages/SupplierCreatePage.tsx`
   - Register routes in `apps/erp/src/modules/procurement/routes.tsx`
   - Mount the module in `apps/erp/src/routes.tsx` as `<Route path="/procurement/*" element={<ProcurementRoutes />} />` (once)

2. **Nav** — update `apps/erp/src/app/navigation.ts` (`href` + submenu)

3. **Types / mock API** — `apps/erp/src/modules/procurement/api/suppliers.ts`

4. **Hooks** — `apps/erp/src/modules/procurement/api/useSuppliers.ts`

5. **Schema** — `apps/erp/src/modules/procurement/suppliers/schema.ts`

6. **List page** — copy `sales/customers/page.tsx`, rename types/hooks

7. **Create page** — copy `sales/customers/new/page.tsx`

8. **Feedback** — toast on success/error; `ConfirmDialog` on delete; optional `Drawer` for detail

Do **not** fork DataTable or FormShell for one module.

---

## 10. Styling

- Tokens live in `packages/ui/src/tokens/` (`--blue`, `--teal`, `--bg`, radius, shadow, z-index, …)
- Tailwind classes: `bg-erp-blue`, `text-erp-muted`, `border-erp-border`, …
- Prefer existing density (compact ERP: ~30px controls, 11–12px text)
- Merge classes with `cn()` from `@erp/ui`
- **No new raw hex** when a token / `erp-*` class exists
- Prefer logical properties for RTL — see [`RTL.md`](./RTL.md)
- Visual reference: `preview (12).html` in the repo root

---

## 11. Do / Don’t

**Do**

- Compose existing components
- Keep Zod schemas next to the feature
- Use Lucide icons
- Type props (avoid `any`)
- Reuse Customers as a template
- Add Storybook stories + tests for new `@erp/ui` work
- Update `docs/REGISTRY.md` when component status changes

**Don’t**

- Put business rules inside `packages/ui`
- Duplicate table/form chrome per module
- Call APIs directly from deep UI primitives
- Add new UI libraries for toast/modal unless agreed
- Commit secrets / real backend credentials into mock APIs
- Mass-break consumers solely to rename props
- Treat `/components-demo` as the approval surface (use Storybook)

---

## 12. Quick import cheat sheet

```ts
// Layout (ERP-wired shell + shared header)
import { AppShell, PageHeader, PageSubmenu } from "@/app";

// Table, forms, feedback
import {
  DataTable,
  FormShell,
  FormSection,
  FormGrid,
  FormField,
  FormInput,
  FormSelect,
  useToast,
  ConfirmDialog,
  Drawer,
  Button,
  StatusBadge,
} from "@erp/ui";

// Data
import { useCustomersQuery } from "@/modules/sales/api";
```

---

## 13. Where to look when stuck

| Question                     | Look here                                                 |
| ---------------------------- | --------------------------------------------------------- |
| How should a list page look? | `apps/erp/src/modules/sales/pages/CustomersPage.tsx`      |
| How should a form page look? | `apps/erp/src/modules/sales/pages/CustomerCreatePage.tsx` |
| All UI states demo?          | `apps/erp/src/app/components-demo/`                       |
| Table prop types?            | `packages/ui/src/types/table.ts`                          |
| Form types?                  | `packages/ui/src/types/forms.ts`                          |
| Nav items?                   | `apps/erp/src/app/navigation.ts`                          |
| Design tokens?               | `packages/ui/src/tokens/`                                 |
| Prototype look & feel?       | `preview (12).html`                                       |

---

_Keep this guide updated when you add a new shared pattern (e.g. new feedback component or data hook convention)._
