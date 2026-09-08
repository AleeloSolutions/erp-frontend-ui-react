/**
 * The business-document layout system: a themeable renderer (three layouts
 * x three table styles) plus the customizer that edits its settings.
 *
 * Named for the document in general, not the invoice in particular —
 * quotations and contracts render through the same layouts.
 *
 * `print/` is deliberately not re-exported wholesale: those are fixed
 * reproductions of an external design, not part of the themeable engine.
 * Sample data lives behind the `@erp/ui/fixtures` subpath so it never
 * reaches an application bundle through this barrel.
 */

export {
  DocumentCustomizer,
  type DocumentCustomizerProps,
  type DocumentCustomizerHandle,
} from "./DocumentCustomizer";
export {
  DocumentCustomizerModal,
  type DocumentCustomizerModalProps,
} from "./DocumentCustomizerModal";
export { DocumentPreview, type DocumentPreviewProps } from "./DocumentPreview";
export {
  DocumentOptionsPanel,
  type DocumentOptionsPanelProps,
} from "./DocumentOptionsPanel";

export { defaultDocumentSettings } from "./config/defaultSettings";
export { documentLayouts, type DocumentLayoutEntry } from "./config/documentLayouts";
export { tableStyles, type TableStyleEntry } from "./config/tableStyles";

export { BubbleLayout, type BubbleLayoutProps } from "./layouts/BubbleLayout";
export { CenterLayout, type CenterLayoutProps } from "./layouts/CenterLayout";
export { DualLayout, type DualLayoutProps } from "./layouts/DualLayout";

export { computeDocumentTotals } from "./lib/computeTotals";
export { buildDocumentQrValue } from "./lib/buildQrValue";
export { companyInitials } from "./lib/companyInitials";

export type { TableStyleProps, TableStylePaymentInfo } from "./tables/types";
export type {
  DocumentData,
  DocumentItem,
  DocumentTaxLine,
  DocumentSettings,
  LayoutKey,
  TableStyleKey,
} from "./types/document";

export {
  InvoicePrintDocumentClassic,
  type InvoicePrintDocumentClassicProps,
  type InvoicePrintLine,
} from "./print/InvoicePrintDocumentClassic";
export {
  InvoicePrintDocumentBackground,
  type InvoicePrintDocumentBackgroundProps,
  type InvoicePrintDocumentBackgroundLine,
} from "./print/InvoicePrintDocumentBackground";
export {
  InvoicePrintDocumentDualHeader,
  type InvoicePrintDocumentDualHeaderProps,
} from "./print/InvoicePrintDocumentDualHeader";
