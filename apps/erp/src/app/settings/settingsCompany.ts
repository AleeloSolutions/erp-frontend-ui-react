/** Company identity fields for the Settings → Company Info tab (UI-only for now). */
export type CompanyInfo = {
  name: string;
  address: string;
  taxId: string;
  email: string;
  phone: string;
};

/**
 * Demo defaults aligned with mock invoice company data. Kept separate from
 * `InvoiceSettings` (Document Layout tab) until a shared backend model exists —
 * address and tax ID overlap conceptually with invoice document overrides.
 */
export const defaultCompanyInfo: CompanyInfo = {
  name: "Germany LTD.",
  address: "Somalia",
  taxId: "978897",
  email: "contact@germany-ltd.example",
  phone: "+252 61 000 0000",
};
