import type { DocumentSettings } from "../types/document";

/** Matches the current hardcoded Dual/Background palette exactly. */
export const defaultDocumentSettings: DocumentSettings = {
  layout: "dual",
  tableStyle: "light",
  font: "Lato, sans-serif",
  primaryColor: "#d16500",
  secondaryColor: "#881a07",
  paperFormat: "A4",
  showQrCode: false,
};
