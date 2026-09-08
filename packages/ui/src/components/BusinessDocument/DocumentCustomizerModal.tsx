import { useRef, useState } from "react";
import { Button } from "../../primitives";
import { Modal } from "../Modal";
import { DocumentCustomizer, type DocumentCustomizerHandle } from "./DocumentCustomizer";
import type { DocumentData, DocumentSettings } from "./types/document";

export interface DocumentCustomizerModalProps {
  open: boolean;
  /** Called on dismiss, and after `onSave` resolves. */
  onClose: () => void;
  /** Sample document the preview renders — real data is never needed here. */
  data: DocumentData;
  settings: DocumentSettings;
  /**
   * Changing this remounts the customizer so its local state re-seeds from
   * `settings`. Callers whose settings arrive asynchronously flip this once
   * the stored layout lands, otherwise the panel keeps editing the defaults
   * it opened with.
   */
  seedKey?: string;
  /**
   * Persist the edited settings. Rejecting leaves the modal open with its
   * saving state cleared, so the caller can surface the failure and the
   * user keeps their edits; resolving closes it.
   */
  onSave: (next: DocumentSettings) => Promise<void>;
  title?: string;
  continueLabel?: string;
  discardLabel?: string;
}

/**
 * The customizer in a dialog: chrome, the fixed preview height it needs to
 * fit, and the imperative plumbing that lets footer buttons drive a panel
 * rendered as the dialog's body.
 *
 * Deliberately free of persistence: it takes `onSave` and knows nothing
 * about where the settings go. The container that owns the endpoint, the
 * error vocabulary, and the success message stays in the application.
 */
export function DocumentCustomizerModal({
  open,
  onClose,
  data,
  settings,
  seedKey,
  onSave,
  title = "Configure your document layout",
  continueLabel = "Continue",
  discardLabel = "Discard",
}: DocumentCustomizerModalProps) {
  const customizerRef = useRef<DocumentCustomizerHandle>(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue(next: DocumentSettings) {
    setSaving(true);
    try {
      await onSave(next);
      onClose();
    } catch {
      // Reported by the caller — this component only owns the in-flight flag.
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
      title={title}
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
            {continueLabel}
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => customizerRef.current?.discard()}
          >
            {discardLabel}
          </Button>
        </>
      }
    >
      <DocumentCustomizer
        key={seedKey}
        ref={customizerRef}
        mode="modal"
        data={data}
        defaultSettings={settings}
        onContinue={handleContinue}
        onDiscard={onClose}
      />
    </Modal>
  );
}
