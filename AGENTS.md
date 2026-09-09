# Agent notes — ERP Platform Frontend

This is an **npm workspaces** monorepo: Vite + React + TypeScript SPA (React Router), not Next.js.

- App entry: `apps/erp/index.html` → `apps/erp/src/main.tsx` → `apps/erp/src/app/App.tsx` → `apps/erp/src/routes.tsx`
- Design system: `packages/ui` (import from `@erp/ui` only — public surface is `packages/ui/src/index.ts`)
- Standards: `docs/ERP_UI_STANDARDS.md`, registry: `docs/REGISTRY.md`, RTL: `docs/RTL.md`
- Storybook (UI review surface): `npm run storybook` — `/components-demo` is temporary
- ERP pages live in `apps/erp/src/modules/{inventory,sales}/pages/`
- Module registry: `apps/erp/src/modules/index.ts` (`moduleRegistry`) holds the compiled-in manifests; `modules/registry.ts` is the live store (compiled-in plus modules registered at runtime, read with `useModules()`). A module is one manifest: the backend `key`, a `navArea`, its nav entry and its `React.lazy` routes. The sidebar and the `/<module>/*` routes are built from the store filtered by `me.enabled_modules` (`<RequireModule>`); the installer is Settings → Modules over `/api/v1/modules/`.
- Packaged modules (a zip installed by platform staff): `lib/runtime.ts` installs `window.KaabeRuntime` (React, jsx-runtime, ReactDOM, Router, Query, hook-form, zod, `@erp/ui`, the api client, the app shell, `registerModule`) before the app renders; `modules/loader.ts` fetches each `me.module_bundles` entry through `apiFetch` (the bundle sits behind the session) and injects it inline, waiting for its `registerModule` call; `<ModuleBundleLoader>` sits above the routes; the catch-all route waits while a bundle is pending (`pendingBundles`) so a deep link survives a hard load. Platform screen: `/platform/modules` (`app/platform/`, apex host, platform accounts only).
- Module kit: `examples/pos` — TypeScript under `modules/pos/` (same folder conventions as `apps/erp/src/modules/sales`: `manifest`, entity folders, pages, api). Vite IIFE with the runtime as externals (`@kaabe/runtime` typed by `examples/pos/runtime-types.d.ts`). `npm run typecheck:module` / `npm run build:module` (or `manage.py pack_module --frontend-src`) produce `dist/module.js` (+ `module.css`) and pack the source into the zip. A bundle must import nothing but the runtime: React comes from the host, never bundled. Compiled-in modules (sales) stay in this SPA repo; packaged ones ship via zip + `registerModule`.
- Module-specific compositions stay in that module’s `components/`
- Module API + React Query hooks stay in that module’s `api/`
- App wiring (providers, ERP `AppShell` defaults, navigation built from the registry, i18n): `apps/erp/src/app/`
- Shared app helpers: `apps/erp/src/lib/` (`api-client.ts`, `i18n.ts`; mocks stay in module `api/`)
- Path alias: `@/` → `apps/erp/src/`
- Django: Vite proxies `/api` to `http://127.0.0.1:8000`

`packages/ui` must stay free of ERP business rules. Prefer composing `@erp/ui` over inventing new layout patterns. See `docs/DEVELOPER_GUIDE.md`.

## Design-system rules (required)

1. Shared UI comes from `@erp/ui` only. Do not duplicate buttons, inputs, tables, dialogs, or date pickers inside modules.
2. Do not hardcode design-system colors. Use semantic tokens from `packages/ui/src/tokens` (`erp-primary`, `erp-secondary`, `erp-danger`, surfaces, borders, etc.). Change roles in tokens — not per instance.
3. Do not create fake or stub interactive controls. If behavior is not implemented, do not render a control that looks interactive.
4. Every reusable `@erp/ui` component needs appropriate Storybook coverage for the behaviors its API actually supports. Storybook is the source of truth for shared UI behavior.
5. Business-specific behavior belongs to the consuming module (labels, permissions, row actions, API calls). Reusable interaction/presentation patterns belong to `@erp/ui`.
6. New semantic colors, variants, or shared patterns go in `packages/ui` — never as one-off styles in a module.
7. DataTable actions:
   - Multiple contextual actions → `getRowActions` MoreHorizontal menu
   - Single direct destructive/important action → explicit `__actions` column control
   - No actions → no actions UI
8. Pass `tableId` when column-visibility persistence is desired (`localStorage` key `erp.datatable.visibility.${tableId}`). Column widths are session-only by design — they always reset to their computed defaults on reload, regardless of `tableId`.
