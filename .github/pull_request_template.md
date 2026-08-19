## Summary

-

## Module / package

- [ ] `packages/ui` (design system)
- [ ] `apps/erp` inventory
- [ ] `apps/erp` sales
- [ ] `apps/erp` app wiring / routes

## Design system checklist (when touching `@erp/ui`)

- [ ] Follows folder structure & naming (`docs/ERP_UI_STANDARDS.md`)
- [ ] New public boolean props use `is*` / `has*` (grandfathered APIs OK if unchanged)
- [ ] Storybook stories cover default, variants, disabled/error/loading/empty as applicable, and RTL
- [ ] Tests cover primary behavior (Vitest)
- [ ] Keyboard / focus basics verified
- [ ] No new hardcoded user-facing strings (use i18n keys)
- [ ] No new raw colors when a token exists
- [ ] `docs/REGISTRY.md` updated if status/API changed
- [ ] `packages/ui/CHANGELOG.md` updated for user-visible API changes

## Test plan

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run build-storybook` (if UI changed)
- [ ] UI still matches existing layout/behavior for touched screens
