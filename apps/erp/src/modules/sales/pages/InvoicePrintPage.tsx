import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@erp/ui";
import { useInvoiceQuery } from "@/modules/sales/api";
import { InvoicePrintDocumentClassic } from "@/modules/sales/components";

/**
 * Standalone print preview for a single invoice (no AppShell chrome — the
 * nav/sidebar has no place on a printed page). The toolbar is hidden via
 * `print:hidden` so only the document itself reaches paper or "Save as PDF".
 */
export default function InvoicePrintPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceQuery = useInvoiceQuery(id);

  return (
    <div className="min-h-screen bg-erp-bg">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-erp-border bg-erp-surface px-4 py-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!invoiceQuery.data}
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" aria-hidden /> Print
        </Button>
      </div>

      <div className="py-8 print:py-0">
        {invoiceQuery.isLoading ? (
          <p className="text-center text-[12px] text-erp-muted">Loading invoice…</p>
        ) : invoiceQuery.isError || !invoiceQuery.data ? (
          <p className="text-center text-[12px] text-erp-muted">Invoice not found.</p>
        ) : (
          <InvoicePrintDocumentClassic invoice={invoiceQuery.data} />
        )}
      </div>
    </div>
  );
}
