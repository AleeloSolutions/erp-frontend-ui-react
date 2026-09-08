import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button, InvoicePrintDocumentClassic } from "@erp/ui";
import { useInvoiceQuery } from "../queries";
import type { Invoice } from "../api";
/**
 * Standalone print preview for a single invoice (no AppShell chrome — the
 * nav/sidebar has no place on a printed page). The toolbar is hidden via
 * `print:hidden` so only the document itself reaches paper or "Save as PDF".
 */

/**
 * The print document is a fixed reproduction of the tenant's paper layout
 * and takes its own shape: display names, and numbers rather than the
 * API's decimal strings. Only product rows cross over — a section or note
 * is an editing aid, not a charge.
 */
function toPrintable(invoice: Invoice) {
  return {
    // A draft has no number yet; the sheet still has to say what it is.
    number: invoice.number || "Draft",
    date: invoice.issue_date,
    dueDate: invoice.due_date,
    customer: invoice.customer.name,
    customerEmail: invoice.customer.email,
    notes: invoice.notes,
    lines: invoice.lines
      .filter((line) => line.kind === "product")
      .map((line) => ({
        id: line.uuid,
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_price),
      })),
  };
}

export default function InvoicePrintPage() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const invoiceQuery = useInvoiceQuery(uuid);

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
          <InvoicePrintDocumentClassic invoice={toPrintable(invoiceQuery.data)} />
        )}
      </div>
    </div>
  );
}
