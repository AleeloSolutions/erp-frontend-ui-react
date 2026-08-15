# Agent notes — ERP Platform Frontend

This is an **npm workspaces** monorepo: Vite + React + TypeScript SPA (React Router), not Next.js.

- App entry: `apps/erp/index.html` → `apps/erp/src/main.tsx` → `apps/erp/src/app/App.tsx` → `apps/erp/src/routes.tsx`
- Design system: `packages/ui` (import from `@erp/ui` only — public surface is `packages/ui/src/index.ts`)
- Standards: `docs/ERP_UI_STANDARDS.md`, registry: `docs/REGISTRY.md`, RTL: `docs/RTL.md`
- Storybook (UI review surface): `npm run storybook` — `/components-demo` is temporary
- ERP pages live in `apps/erp/src/modules/{accounting,sales,procurement,hr}/pages/`
- Module-specific compositions stay in that module’s `components/`
- Module API + React Query hooks stay in that module’s `api/`
- App wiring (providers, ERP `AppShell` defaults, navigation, i18n): `apps/erp/src/app/`
- Shared app helpers: `apps/erp/src/lib/` (`api-client.ts`, `i18n.ts`; mocks stay in module `api/`)
- Path alias: `@/` → `apps/erp/src/`
- Django: Vite proxies `/api` to `http://127.0.0.1:8000`

`packages/ui` must stay free of ERP business rules. Prefer composing `@erp/ui` over inventing new layout patterns. See `docs/DEVELOPER_GUIDE.md`.
