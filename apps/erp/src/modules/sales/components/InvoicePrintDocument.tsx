// import { formatCurrency } from "@erp/ui";
// import type { Invoice } from "@/modules/sales/api";

// /** No company-profile module exists yet — placeholder "our company" details, same spirit as the invoice form's fixed account list. */
// const companyProfile = {
//   name: "ERP Platform",
//   addressLines: ["Mogadishu, Somalia"],
//   taxId: "000000",
// };

// export interface InvoicePrintDocumentProps {
//   invoice: Invoice;
// }

// /**
//  * Printable invoice document — A4-proportioned, styled for both the screen
//  * preview and the browser print dialog (`print:` utilities strip the paper
//  * shadow/margins so the page prints edge-to-edge on real paper).
//  */
// export function InvoicePrintDocument({ invoice }: InvoicePrintDocumentProps) {
//   const total = invoice.lines.reduce(
//     (sum, line) => sum + line.quantity * line.unitPrice,
//     0
//   );

//   return (
//     <div className="mx-auto max-w-[210mm] bg-white text-erp-text shadow-md print:max-w-none  print:shadow-none">
//       <style>{"@page { size: A4; margin: 0; }"}</style>
//       <div className="grid grid-cols-3 items-start gap-4 rounded-[6px] bg-erp-header px-6 py-5 p-[15mm] print:p-[10mm]">
//         <div className="text-[11px] leading-relaxed text-erp-muted ">
//           {companyProfile.addressLines.map((line) => (
//             <div key={line}>{line}</div>
//           ))}
//           <div className="mt-1">
//             <span className="font-bold text-erp-text">Tax ID: </span>
//             {companyProfile.taxId}
//           </div>
//         </div>
//         <div className="text-center">
//           <div className="mx-auto mb-1 grid h-12 w-12 place-items-center rounded-full bg-erp-primary text-[13px] font-bold text-erp-primary-foreground">
//             {companyProfile.name.charAt(0)}
//           </div>
//           <div className="text-[12px] font-bold text-erp-text">{companyProfile.name}</div>
//         </div>
//         <div className="text-right text-[12px] font-bold text-erp-text">
//           {invoice.customer}
//         </div>
//       </div>

//       <h1 className="mb-1 mt-6 text-[1.75rem] font-[500] text-erp-primary px-[15mm] print:px-[10mm]">
//         Invoice {invoice.number}
//       </h1>

//       <div className="px-[15mm] print:px-[10mm] mb-6 grid grid-cols-2 gap-4 text-[12px]">
//         <div>
//           <div className="font-bold text-erp-primary">Invoice Date</div>
//           <div>{invoice.date}</div>
//         </div>
//         <div>
//           <div className="font-bold text-erp-primary">Due Date</div>
//           <div>{invoice.dueDate}</div>
//         </div>
//       </div>

//       <table className="w-full border-collapse text-[12px] mx-[15mm] print:mx-[10mm]">
//         <thead>
//           <tr className="border-b-2 border-erp-primary text-left text-erp-primary">
//             <th className="py-1.5 font-bold">Description</th>
//             <th className="py-1.5 text-right font-bold">Quantity</th>
//             <th className="py-1.5 text-right font-bold">Unit Price</th>
//             <th className="py-1.5 text-right font-bold">Amount</th>
//           </tr>
//         </thead>
//         <tbody>
//           {invoice.lines.map((line, index) => (
//             <tr
//               key={line.id}
//               className={index % 2 === 1 ? "bg-erp-surface-tint" : undefined}
//             >
//               <td className="py-1.5">{line.description}</td>
//               <td className="py-1.5 text-right">{line.quantity.toFixed(2)}</td>
//               <td className="py-1.5 text-right">{formatCurrency(line.unitPrice)}</td>
//               <td className="py-1.5 text-right">
//                 {formatCurrency(line.quantity * line.unitPrice)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot>
//           <tr className="border-t-2 border-erp-primary">
//             <td colSpan={3} className="py-2 text-right font-bold">
//               Total
//             </td>
//             <td className="py-2 text-right font-bold">{formatCurrency(total)}</td>
//           </tr>
//         </tfoot>
//       </table>

//       <p className="mt-6 text-[12px] px-[15mm] print:px-[10mm]">
//         Payment Communication: <span className="font-bold">{invoice.number}</span>
//       </p>

//       <div className="mt-16 border-t border-erp-border pt-3 text-center text-[10px] text-erp-muted">
//          Page 1 / 1
//       </div>
//     </div>
//   );
// }
