/**
 * Inventory top tabs: only entities this account can view.
 */

import { useNavbarDefaults } from "@/app";
import { useSession } from "@/app/session";
import { inventorySubmenu } from "./manifest";

function viewing(...resources: string[]): string[] {
  return resources.flatMap((resource) => [
    `${resource}.view`,
    `${resource}.view_branch`,
    `${resource}.view_own`,
  ]);
}

const CHILD_NAV: Record<string, string[]> = {
  items: viewing("inventory.item"),
  categories: viewing("inventory.category"),
  movements: viewing("inventory.movement"),
};

function holdsAny(codes: string[] | null, required: string[]): boolean {
  if (required.length === 0) return true;
  if (codes === null) return true;
  return required.some((code) => codes.includes(code));
}

export function inventorySubmenuFor(codes: string[] | null) {
  return inventorySubmenu.filter((item) => holdsAny(codes, CHILD_NAV[item.key] ?? []));
}

/** First Inventory URL this account may open (fallback: items). */
export function firstInventoryHref(codes: string[] | null): string {
  return inventorySubmenuFor(codes)[0]?.href ?? "/inventory/items";
}

export function useInventoryNavbar(activeKey: string) {
  const session = useSession();
  return useNavbarDefaults({
    brandLabel: "Inventory",
    submenuItems: inventorySubmenuFor(session?.permissions ?? null),
    submenuActiveKey: activeKey,
  });
}
