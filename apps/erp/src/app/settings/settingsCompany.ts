/**
 * Settings → Company Info maps 1:1 onto the two persisted tables: the
 * tenant row (`al_clients`) and its settings (`al_client_settings`).
 * Every field below is a real column, and every editable column of those
 * tables is here — except the document-layout ones (colors, fonts, logo,
 * paper format...), which the Document Layout customizer owns.
 *
 * `slug`, `status` and `trialEndsAt` are columns the backend refuses to
 * change from this screen (the slug is the customer's URL; the rest are
 * billing events), so they are shown read-only rather than hidden. Terms
 * acceptance is not a column at all any more: it is an append-only row
 * per acceptance on the backend.
 */
export type CompanyInfo = {
  // al_clients
  name: string;
  slug: string;
  status: string;
  trialEndsAt: string | null;
  // al_client_settings -- the address is structured, never one blob
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  taxNumber: string;
  email: string;
  phone: string;
  language: string;
  country: string;
  timezone: string;
  currency: string;
  teamSize: string;
  primaryInterest: string;
};

export { formatAddress } from "@/lib/address";

/** Mirrors apps/client_config/models.py Language.choices. */
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "so", label: "Somali" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
];

/** Mirrors TeamSize.choices (the signup form's "company size"). */
export const TEAM_SIZE_OPTIONS = [
  { value: "1-5", label: "1 - 5 employees" },
  { value: "5-20", label: "5 - 20 employees" },
  { value: "20-50", label: "20 - 50 employees" },
  { value: "50-250", label: "50 - 250 employees" },
  { value: "250-over", label: "> 250 employees" },
];

/** Mirrors PrimaryInterest.choices. */
export const PRIMARY_INTEREST_OPTIONS = [
  { value: "use_in_company", label: "Use it in my company" },
  { value: "partner", label: "Offer ERP services to other companies" },
  { value: "student", label: "I am a student" },
  { value: "teacher", label: "I am a teacher" },
];

/** The countries the signup form offers; `country` is a free ISO-3166
 * alpha-2 column, so a value outside this list is preserved. */
export const COUNTRY_OPTIONS = [
  { value: "SO", label: "Somalia" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
];

/** Currencies the backend derives at signup, plus common neighbours. */
export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ETB", label: "ETB — Ethiopian Birr" },
  { value: "DJF", label: "DJF — Djiboutian Franc" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Pound Sterling" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Africa/Mogadishu", label: "Africa/Mogadishu" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi" },
  { value: "Africa/Addis_Ababa", label: "Africa/Addis_Ababa" },
  { value: "Africa/Djibouti", label: "Africa/Djibouti" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "UTC", label: "UTC" },
];

/** Keeps a stored value selectable even when it isn't in our shortlist
 * (the columns are free-form; only the frontend curates a list). */
export function withCurrentValue(
  options: { value: string; label: string }[],
  current: string
) {
  if (!current || options.some((option) => option.value === current)) return options;
  return [...options, { value: current, label: current }];
}

/** Demo defaults for Storybook, where no backend is available. */
export const defaultCompanyInfo: CompanyInfo = {
  name: "Germany LTD.",
  slug: "germany-ltd",
  status: "trial",
  trialEndsAt: null,
  addressLine1: "Maka Al-Mukarama Road",
  addressLine2: "",
  city: "Mogadishu",
  state: "Banaadir",
  postalCode: "",
  taxNumber: "978897",
  email: "contact@germany-ltd.example",
  phone: "+252 61 000 0000",
  language: "en",
  country: "SO",
  timezone: "Africa/Mogadishu",
  currency: "USD",
  teamSize: "1-5",
  primaryInterest: "use_in_company",
};
