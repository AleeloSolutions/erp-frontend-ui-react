# ERP Frontend Standards — Working Contract

**Version:** 1.1 (amended from draft 1.0)  
**Audience:** UI Component Team + management  
**Related:** `docs/DEVELOPER_GUIDE.md`, `docs/REGISTRY.md`, `docs/RTL.md`

This document is the target contract for `@erp/ui`. Where it differs from the original draft, the **Amendments** section wins.

---

## Amendments (v1.1)

| Topic | Decision |
|-------|----------|
| Styling | **Tailwind CSS v4 + CSS design tokens** (locked). CSS Modules are not used. |
| Routes | Feature routes live in each module (`modules/<name>/routes.tsx`). `apps/erp/src/routes.tsx` only mounts app pages and module prefixes (`/sales/*`, `/inventory/*`, …). |
| Boolean props | **New** public APIs use `isOpen`, `isDisabled`, `isLoading`, `isRequired`, `hasError`. Existing APIs are grandfathered; migrate only on substantial change or approved breaking release. |
| Review surface | **Storybook** is the official management review/approval surface. `/components-demo` may remain temporarily. |
| Component status | Until the registry workflow is live, existing exports are **pre-Approved / in progress** — usable by modules, not frozen. |
| Router in layout | Interim debt: `Sidebar` / `MobileNav` / `PageSubmenu` import `react-router-dom`. New layout work should prefer injected `Link` / `pathname` props; full decoupling is planned. |
| Forms | Short-term: keep `FormShell` + app-owned React Hook Form + Zod. A schema-driven `<Form>` wrapper may be added later via Gate 1. |
| DataTable | Treat as **in progress**. Evolve additively against §6.3; no big-bang rewrite. |
| RTL | Architectural requirement now (logical properties, Storybook RTL). Full Arabic locale packs can follow later. |
| i18n | Phase 0 foundation required. New user-facing strings use translation keys (`common.*`, `ui.*`). |

Core principles from the original draft still apply: build once in `@erp/ui`, composition over giant props, data-agnostic components, accessibility, nothing newly Approved without Storybook review once the registry is active.

---

## Repository rules (unchanged intent)

- Modules import **only** `@erp/ui` (package root), never `packages/ui/src/...` internals.
- `packages/ui` never imports from `apps/erp`.
- Shared UI used by two+ modules must live in `@erp/ui`.
- TypeScript strict; function components only.
- No new dependency without written proposal + approval.

---

## Tooling (Phase 0)

| Area | Decision |
|------|----------|
| Language | TypeScript strict |
| App build | Vite |
| Component workshop | Storybook (`npm run storybook`) |
| Styling | Tailwind v4 + tokens in `packages/ui/src/tokens/` |
| Server data | TanStack Query (modules only) |
| Forms | React Hook Form + Zod (app/modules) |
| Tables | TanStack Table via `DataTable` |
| Icons | Lucide only |
| Testing | Vitest + React Testing Library |
| Lint/format | ESLint + Prettier; husky + lint-staged |
| i18n | i18next + react-i18next |

---

## Workflow (target)

1. Spec (Gate 1) → 2. PR + peer review → 3. Storybook visual review → 4. Registry **Approved** → 5. Modules may rely on the frozen API.

See `docs/REGISTRY.md` for status tracking.

---

## Definition of Done (per new/substantially changed component)

1. Spec approved when Gates are active  
2. Structure/naming per this contract  
3. Typecheck + lint clean; props exported  
4. Storybook stories: default, variants, disabled/error/loading/empty as applicable, RTL  
5. Tests for primary behavior  
6. Keyboard/focus basics  
7. Strings via i18n keys (new chrome)  
8. Styles via tokens / Tailwind theme — no new raw hex when a token exists  
9. Peer review + Storybook review when Gates are active  
10. Registry row updated  

---

*Amendments are recorded here. Prefer updating this file over silent process drift.*
