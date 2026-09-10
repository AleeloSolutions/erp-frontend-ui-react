/**
 * Sales top tabs: only entities this account can view.
 */

import { useNavbarDefaults } from "@/app";
import { CHILD_NAV_REQUIREMENTS, holdsAny } from "@/app/access";
import { useSession } from "@/app/session";
import { salesSubmenu } from "./manifest";

export function salesSubmenuFor(codes: string[] | null) {
  const reqs = CHILD_NAV_REQUIREMENTS.sales;
  return salesSubmenu.filter((item) => holdsAny(codes, reqs[item.key] ?? []));
}

/** First Sales URL this account may open (fallback: customers). */
export function firstSalesHref(codes: string[] | null): string {
  return salesSubmenuFor(codes)[0]?.href ?? "/sales/customers";
}

export function useSalesNavbar(activeKey: string) {
  const session = useSession();
  return useNavbarDefaults({
    brandLabel: "Sales",
    submenuItems: salesSubmenuFor(session?.permissions ?? null),
    submenuActiveKey: activeKey,
  });
}
