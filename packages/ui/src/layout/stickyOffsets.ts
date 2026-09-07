/** Navbar's fixed rendered height (`h-[46px]`) — the first sticky layer. */
export const NAVBAR_HEIGHT = 46;

/**
 * ControlPanel height with search/pagination (list toolbars):
 * `pt-2` (8) + `pb-3` (12) + search/actions row (`min-h-8` = 32) + 1px border.
 */
export const CONTROL_PANEL_HEIGHT = 53;

/**
 * ControlPanel height when only PageActions sit in it (form pages):
 * `pt-1` (4) + `pb-1.5` (6) + actions row (`min-h-7` = 28) + 1px border.
 * Prefer measuring `[data-control-panel]` at runtime; this is the fallback.
 */
export const CONTROL_PANEL_COMPACT_HEIGHT = 39;
