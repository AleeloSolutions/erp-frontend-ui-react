/**
 * The company address is structured columns on the backend
 * (`al_client_settings.address_line1/2, city, state, postal_code` -- never
 * one blob). Screens edit the parts; documents print one line.
 */
export interface AddressParts {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

export type AddressPartKey = keyof AddressParts;

export const ADDRESS_PART_KEYS: AddressPartKey[] = [
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
];

/** One printable line from the structured parts; "" when all are empty. */
export function formatAddress(parts: Partial<AddressParts>): string {
  const locality = [parts.city, parts.state, parts.postalCode].filter(Boolean).join(" ");
  return [parts.addressLine1, parts.addressLine2, locality].filter(Boolean).join(", ");
}
