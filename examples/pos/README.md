# examples/pos — the module kit

The frontend half of a module package (backend half:
`kaabe-backend/examples/pos`). Develop under `modules/pos/` — the same
folder conventions as `apps/erp/src/modules/sales` (`manifest.ts`, entity
folders with `api` / `pages` / `routes`). `pack_module --frontend-src`
copies that tree into the zip and builds one script + stylesheet:

```
frontend/modules/pos/…     TypeScript source (handoff)
frontend/module.js         IIFE (pack output, not hand-written)
frontend/module.css
```

The host SPA loads the built assets at runtime for every tenant that has
the module — no SPA release needed.

```bash
npm run typecheck:module      # tsc over examples/pos
npm run build:module          # -> examples/pos/dist/module.js + module.css
```

How it stays compatible with the host:

- `vite.config.ts` builds an IIFE with React, React Router, React Query,
  `@erp/ui`, react-hook-form, zod and `@kaabe/runtime` as **externals**,
  resolved from `window.KaabeRuntime` — the object the SPA installs at boot
  (`apps/erp/src/lib/runtime.ts`). One React, the host's providers, the
  host's API client and app shell.
- `runtime-types.d.ts` types `@kaabe/runtime` from the host's own declaration,
  so `npm run typecheck:module` checks the module against what it will get.
- `modules/pos/index.tsx` registers the manifest — `key`, `nav`, `resources`,
  `Routes` — the same `ModuleManifest` a compiled-in module declares. Its
  `key` and `resources` match the backend descriptor.
- `modules/pos/styles.css` compiles the Tailwind utilities the module uses
  against the shared tokens; the host's CSS only covers the host's own sources.

To start a new module, copy this folder, rename `pos` in `vite.config.ts`
(`name` / entry), `modules/<key>/`, and keep the externals list as is.
