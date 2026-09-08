import type { DocumentData, DocumentSettings } from "./types/document";
import { documentLayouts } from "./config/documentLayouts";

/**
 * Minimal preview: looks up the active layout from the registry and
 * renders it. No panel/chrome yet — that's `DocumentCustomizer` (Step 4).
 */
export interface DocumentPreviewProps {
  data: DocumentData;
  settings: DocumentSettings;
}

export function DocumentPreview({ data, settings }: DocumentPreviewProps) {
  const Layout = documentLayouts[settings.layout].component;
  return <Layout data={data} settings={settings} />;
}
