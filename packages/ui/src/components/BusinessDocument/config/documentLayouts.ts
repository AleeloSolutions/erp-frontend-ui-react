import type { ComponentType } from "react";
import type { DocumentData, DocumentSettings, LayoutKey } from "../types/document";
import { DualLayout } from "../layouts/DualLayout";
import { CenterLayout } from "../layouts/CenterLayout";
import { BubbleLayout } from "../layouts/BubbleLayout";

export interface DocumentLayoutEntry {
  label: string;
  thumbnail: string;
  component: ComponentType<{ data: DocumentData; settings: DocumentSettings }>;
}

export const documentLayouts: Record<LayoutKey, DocumentLayoutEntry> = {
  center: {
    label: "Classic",
    thumbnail: "/thumbnails/center.svg",
    component: CenterLayout,
  },
  dual: {
    label: "Dual",
    thumbnail: "/thumbnails/dual.svg",
    component: DualLayout,
  },
  bubble: {
    label: "Bubble",
    thumbnail: "/thumbnails/bubble.svg",
    component: BubbleLayout,
  },
};
