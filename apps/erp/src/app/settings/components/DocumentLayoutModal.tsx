import { useRef } from "react";
import { Button, Modal } from "@erp/ui";
import {
  InvoiceCustomizer,
  type InvoiceCustomizerHandle,
} from "@/modules/sales/components/invoice/InvoiceCustomizer";
import { defaultInvoiceSettings } from "@/modules/sales/components/invoice/config/defaultSettings";
import { mockInvoicePreviewData } from "@/modules/sales/components/invoice/mock/mockInvoiceData";

export interface DocumentLayoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentLayoutModal({ open, onClose }: DocumentLayoutModalProps) {
  const customizerRef = useRef<InvoiceCustomizerHandle>(null);

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
          <Button variant="primary" onClick={() => customizerRef.current?.continue()}>
            Continue
          </Button>
          <Button variant="secondary" onClick={() => customizerRef.current?.discard()}>
            Discard
          </Button>
        </>
      }
    >
      <InvoiceCustomizer
        ref={customizerRef}
        mode="modal"
        data={mockInvoicePreviewData}
        defaultSettings={defaultInvoiceSettings}
        onContinue={onClose}
        onDiscard={onClose}
      />
    </Modal>
  );
}
