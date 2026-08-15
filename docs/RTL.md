# RTL readiness

Arabic (and other RTL locales) may be enabled later. Components must be **RTL-ready** now.

## Rules

1. Prefer **logical** CSS / Tailwind utilities: `ms-*` / `me-*`, `ps-*` / `pe-*`, `start-*` / `end-*`, `text-start` / `text-end` over `ml`/`mr`/`left`/`right`/`text-left`.
2. Mirroring: drawers/menus that open from the “end” edge should follow `dir` (e.g. drawer default end side).
3. Icons that imply direction (chevrons, arrows) should flip in RTL when they convey navigation.
4. Do not assume LTR string concatenation for layout; keep chrome strings in i18n.
5. Storybook must support an RTL toggle (`dir="rtl"` on preview root).

## Checking work

- Toggle RTL in Storybook and spot-check padding, alignment, and overlays.
- When substantially editing a component, replace physical inset utilities with logical ones in the touched code.

## Out of scope for Phase 0

- Full Arabic translation packs
- Locale-specific calendars / number systems beyond `Intl` formatters
