/** Navbar's fixed rendered height (`h-[46px]`) — the first sticky layer. */
export const NAVBAR_HEIGHT = 46;

/** ControlPanel's fixed rendered height (content row + `pt-2 pb-3` padding + 1px border). */
export const CONTROL_PANEL_HEIGHT = 49;

/**
 * PageContainer's desktop bottom padding (`pb-[26px]`). A page-scoped
 * scroll region (e.g. DataTable's internal scroll body) must subtract this
 * too, alongside the sticky chrome above it — otherwise total content height
 * is `100vh + this`, and the page itself grows a second, outer scrollbar.
 */
export const PAGE_CONTAINER_BOTTOM_PADDING = 26;
