# ERP Frontend

npm workspaces monorepo for the ERP SPA and shared design system.

```text
erp-frontend/
├── packages/ui/     # Design system (tokens, primitives, composites, layout)
└── apps/erp/        # ERP application (modules, routes, providers)
```

## Quick start

```bash
npm install
npm run dev
```

- Home: [http://localhost:5173](http://localhost:5173)
- Component demo: [http://localhost:5173/components-demo](http://localhost:5173/components-demo)
- Example module: [http://localhost:5173/sales/customers](http://localhost:5173/sales/customers)

Copy `apps/erp/.env.example` to `apps/erp/.env`:

```bash
VITE_API_BASE_URL=/api
```

## Scripts

Run from the repo root:

```bash
npm run dev         # Vite dev server (@erp/app)
npm run build       # production build
npm run preview     # preview production build
npm run typecheck   # TypeScript in all workspaces
npm run lint        # ESLint in all workspaces
```

## Architecture

| Area | Location |
|------|----------|
| Design tokens | `packages/ui/src/tokens/` |
| Primitives (atoms) | `packages/ui/src/primitives/` |
| Composites | `packages/ui/src/components/` |
| App shell | `packages/ui/src/layout/` |
| Public UI exports | `packages/ui/src/index.ts` (`@erp/ui`) |
| ERP routes | `apps/erp/src/routes.tsx` |
| Providers / nav wiring | `apps/erp/src/app/` |
| API client | `apps/erp/src/lib/api-client.ts` |
| Sales module | `apps/erp/src/modules/sales/` |
| Visual reference | `preview (12).html` |

Intended to talk to a **Django** API. Sales customers/quotations still use **mocks** in `apps/erp/src/modules/sales/api/`.

**Django tips**

- Dev: Vite proxies `/api` → `http://127.0.0.1:8000` (`apps/erp/vite.config.ts`).
- Allow the Vite origin in CORS if the SPA is served separately.
- Production: `npm run build` → `apps/erp/dist/`.

## Docs

**Start here → [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)**

## Stack

- Vite · React 19 · TypeScript · React Router
- Tailwind CSS v4
- TanStack Table v8 · TanStack Query v5
- React Hook Form · Zod
- Lucide React
