import type { ComponentType } from "react";
import type { InvoiceData, InvoiceSettings, LayoutKey } from "../types/invoice";
import { DualInvoice } from "../layouts/DualInvoice";
import { CenterInvoice } from "../layouts/CenterInvoice";
import { BubbleInvoice } from "../layouts/BubbleInvoice";

export interface InvoiceLayoutEntry {
  label: string;
  thumbnail: string;
  component: ComponentType<{ data: InvoiceData; settings: InvoiceSettings }>;
}

export const invoiceLayouts: Record<LayoutKey, InvoiceLayoutEntry> = {
  dual: {
    label: "Dual",
    thumbnail: "/thumbnails/dual.svg",
    component: DualInvoice,
  },
  center: {
    label: "Center",
    thumbnail: "/thumbnails/center.svg",
    component: CenterInvoice,
  },
  bubble: {
    label: "Bubble",
    thumbnail: "/thumbnails/bubble.svg",
    component: BubbleInvoice,
  },
};
