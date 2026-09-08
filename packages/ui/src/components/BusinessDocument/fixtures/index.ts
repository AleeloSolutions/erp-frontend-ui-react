/**
 * Sample document data for Storybook and for design-preview surfaces such
 * as the document-layout customizer.
 *
 * Exposed through the `@erp/ui/fixtures` subpath rather than the package
 * barrel: this module pulls in a placeholder logo image, and nothing that
 * does not ask for sample data by name should carry it into a bundle.
 */
export { sampleInvoice, sampleInvoicePreview } from "./sampleInvoice";
export { sampleInvoiceClassic } from "./sampleInvoiceClassic";
