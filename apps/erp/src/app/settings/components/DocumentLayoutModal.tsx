import { useRef, useState } from "react";
import { Button, Modal, useToast } from "@erp/ui";
import {
  InvoiceCustomizer,
  type InvoiceCustomizerHandle,
} from "@/modules/sales/components/invoice/InvoiceCustomizer";
import type { InvoiceSettings } from "@/modules/sales/components/invoice/types/invoice";
import { mockInvoicePreviewData } from "@/modules/sales/components/invoice/mock/mockInvoiceData";
import { ApiError } from "@/lib/api-client";
import { useDocumentLayout } from "../api";

export interface DocumentLayoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentLayoutModal({ open, onClose }: DocumentLayoutModalProps) {
  const customizerRef = useRef<InvoiceCustomizerHandle>(null);
  const { settings, loaded, save } = useDocumentLayout();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleContinue(next: InvoiceSettings) {
    setSaving(true);
    try {
      await save(next);
      toast({ title: "Document layout saved", variant: "success" });
      onClose();
    } catch (err) {
      toast({
        title: "Could not save document layout",
        description:
          err instanceof ApiError ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      className="rounded-none"
      title="Configure your document layout"
      bodyClassName="flex h-[min(680px,calc(100vh-10rem))] min-h-0 flex-col overflow-hidden p-0"
      footerClassName="justify-start"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button
            variant="primary"
            loading={saving}
            onClick={() => customizerRef.current?.continue()}
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => customizerRef.current?.discard()}
          >
            Discard
          </Button>
        </>
      }
    >
      <InvoiceCustomizer
        // Re-seed the customizer once the saved layout arrives, so its
        // local state starts from what's stored rather than the demo.
        key={loaded ? "live" : "demo"}
        ref={customizerRef}
        mode="modal"
        data={mockInvoicePreviewData}
        defaultSettings={settings}
        onContinue={handleContinue}
        onDiscard={onClose}
      />
    </Modal>
  );
}
