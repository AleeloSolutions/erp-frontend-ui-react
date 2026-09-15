/**
 * Sales top tabs: only entities this account can view.
 *
 * The Sales list is the module home (`/sales`), opened from the brand —
 * not a submenu tab beside Customers / Products / Settings.
 */

import { useNavigate } from "react-router-dom";
import { useNavbarDefaults } from "@/app";
import { CHILD_NAV_REQUIREMENTS, holdsAny } from "@/app/access";
import { useSession } from "@/app/session";
import { salesSubmenu } from "./manifest";

export function salesSubmenuFor(codes: string[] | null) {
  const reqs = CHILD_NAV_REQUIREMENTS.sales;
  return salesSubmenu.filter((item) => holdsAny(codes, reqs[item.key] ?? []));
}

/** First Sales URL this account may open — module home `/sales` when permitted. */
export function firstSalesHref(codes: string[] | null): string {
  if (holdsAny(codes, CHILD_NAV_REQUIREMENTS.sales.orders)) return "/sales";
  const items = salesSubmenuFor(codes);
  return items[0]?.href ?? "/sales";
}

export function useSalesNavbar(activeKey: string) {
  const navigate = useNavigate();
  const session = useSession();
  const codes = session?.permissions ?? null;
  return useNavbarDefaults({
    brandLabel: "Sales",
    // Brand (grid + "Sales") opens the sales list, not the app home.
    onHomeClick: () => navigate(firstSalesHref(codes)),
    submenuItems: salesSubmenuFor(codes),
    // "orders" is the list home — no matching submenu tab, so nothing highlighted.
    submenuActiveKey: activeKey === "orders" ? undefined : activeKey,
  });
}
