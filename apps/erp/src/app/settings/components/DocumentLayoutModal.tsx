import { useToast, DocumentCustomizerModal, type DocumentSettings } from "@erp/ui";
import { sampleInvoicePreview } from "@erp/ui/fixtures";
import { ApiError } from "@/lib/api-client";
import { useDocumentLayout } from "../api";

export interface DocumentLayoutModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Settings → Document Layout. The dialog itself is `@erp/ui`'s; this
 * container supplies what the design system must not know — the tenant
 * endpoints behind `useDocumentLayout`, this app's error type, and the
 * wording of the result.
 */
export function DocumentLayoutModal({ open, onClose }: DocumentLayoutModalProps) {
  const { settings, loaded, save } = useDocumentLayout();
  const { toast } = useToast();

  async function handleSave(next: DocumentSettings) {
    try {
      await save(next);
    } catch (err) {
      toast({
        title: "Could not save document layout",
        description:
          err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
      // Rethrown so the dialog stays open with the user's edits intact.
      throw err;
    }
    toast({ title: "Document layout saved", variant: "success" });
  }

  return (
    <DocumentCustomizerModal
      open={open}
      onClose={onClose}
      data={sampleInvoicePreview}
      settings={settings}
      // Re-seed once the saved layout arrives, so the panel starts from
      // what is stored rather than the demo defaults.
      seedKey={loaded ? "live" : "demo"}
      onSave={handleSave}
    />
  );
}
