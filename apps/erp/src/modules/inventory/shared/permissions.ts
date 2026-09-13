/**
 * Whether this account may act on an inventory resource.
 *
 * Codes come from the session permission matrix as
 * `<module>.<resource>.<verb>` plus optional `_branch` / `_own` rungs.
 * Holding any rung of a verb is enough to offer the control; the API is
 * still what refuses.
 *
 * Unknown codes (`null` / `undefined`, still loading or Storybook) offer
 * everything rather than flashing an empty toolbar — same rule as nav.
 */

export type InventoryVerb = "view" | "create" | "edit" | "delete";

/** True if codes include any scope rung of resource.verb (or still loading). */
export function can(
  codes: string[] | null | undefined,
  resource: string,
  verb: InventoryVerb
): boolean {
  if (codes == null) return true;
  return [
    `${resource}.${verb}`,
    `${resource}.${verb}_branch`,
    `${resource}.${verb}_own`,
  ].some((code) => codes.includes(code));
}
